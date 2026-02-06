const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);
const logger = require('../utils/logger');
const cacheService = require('../utils/cacheService');
const { getKaggleCacheDir } = require('../config/kaggle');
const {
    sanitizeSearchQuery,
    parseKaggleListOutput,
    inferColumnType,
    normalizeDatasetRef,
    extractZipFile,
    calculateSimilarity
} = require('../utils/kaggleHelpers');
const { parseSampleFile, extractSampleData } = require('./fileService');

// Timeouts
const SEARCH_TIMEOUT = 30000; // 30 seconds
const DOWNLOAD_TIMEOUT = 60000; // 60 seconds
const MAX_DATASETS_TO_DOWNLOAD = 3;
const MAX_SAMPLE_ROWS = 50;

/**
 * Extract key search terms from topic
 * @param {string} topic - Dataset topic
 * @returns {string} Extracted key terms
 */
const extractKeyTerms = (topic) => {
    if (!topic) return '';

    // Remove common words that don't help with search
    const stopWords = ['data', 'dataset', 'database', 'information', 'records', 'list', 'collection'];

    // Split into words and filter
    const words = topic
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));

    return words.join(' ');
};

/**
 * Search Kaggle datasets using CLI (topic-only search)
 * @param {string} topic - Dataset topic (ONLY this is used for search)
 * @param {string} description - Dataset description (NOT used for search)
 * @returns {Promise<Array>} List of datasets
 */
const searchKaggleDatasets = async (topic, description) => {
    try {
        // Extract key terms from topic only (ignore description)
        const keyTerms = extractKeyTerms(topic);
        const query = sanitizeSearchQuery(keyTerms);

        if (!query) {
            logger.warn('Empty search query after sanitization');
            return [];
        }

        logger.info(`Searching Kaggle for topic: "${topic}" → query: "${query}"`);

        // Execute Kaggle CLI search with extracted terms
        const command = `kaggle datasets list -s "${query}" --max-size 10`;

        const { stdout, stderr } = await Promise.race([
            execAsync(command),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT)
            )
        ]);

        if (stderr && !stderr.includes('Warning')) {
            logger.warn(`Kaggle CLI warning: ${stderr}`);
        }

        // Parse output
        const datasets = parseKaggleListOutput(stdout);
        logger.success(`Found ${datasets.length} Kaggle datasets for "${query}"`);

        return datasets;

    } catch (error) {
        logger.error(`Kaggle search failed: ${error.message}`);
        return [];
    }
};

/**
 * Rank datasets based on relevance (topic-only matching)
 * @param {Array} datasets - List of datasets from search
 * @param {string} topic - Original topic (used for ranking)
 * @param {string} description - Original description (NOT used for ranking)
 * @returns {Array} Ranked datasets (top 3)
 */
const rankDatasets = (datasets, topic, description) => {
    if (!datasets || datasets.length === 0) {
        return [];
    }

    // Use only topic for similarity matching (ignore description)
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 2);

    // Score each dataset
    const scored = datasets.map(dataset => {
        let score = 0;
        const titleLower = dataset.title.toLowerCase();

        // Exact phrase match bonus (weight: 50%)
        if (titleLower.includes(topicLower)) {
            score += 50;
        }

        // Individual word matches (weight: 30%)
        const wordMatches = topicWords.filter(word => titleLower.includes(word)).length;
        const wordMatchScore = (wordMatches / Math.max(topicWords.length, 1)) * 30;
        score += wordMatchScore;

        // Popularity metrics (weight: 10%)
        const popularityScore = (
            Math.min(dataset.downloadCount / 1000, 10) +
            Math.min(dataset.voteCount / 100, 10)
        ) / 20;
        score += popularityScore * 10;

        // Usability rating (weight: 10%)
        score += (dataset.usabilityRating / 1.0) * 10;

        return {
            ...dataset,
            relevanceScore: score
        };
    });

    // Sort by score descending
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 3
    const topDatasets = scored.slice(0, MAX_DATASETS_TO_DOWNLOAD);

    logger.info(`Top ranked datasets: ${topDatasets.map(d => d.ref).join(', ')}`);

    return topDatasets;
};

/**
 * Get dataset preview using Kaggle API (no download required)
 * @param {string} datasetRef - Dataset reference (owner/name)
 * @returns {Promise<Object>} Dataset preview with sample data
 */
const getDatasetPreviewAPI = async (datasetRef) => {
    try {
        const { getDatasetPreview } = require('./kaggleApiService');

        logger.info(`Fetching preview for: ${datasetRef}`);

        const preview = await getDatasetPreview(datasetRef);

        if (!preview) {
            throw new Error('No preview available');
        }

        logger.success(`Got preview from: ${preview.fileName}`);

        return {
            fileName: preview.fileName,
            totalRows: preview.totalRows,
            sampleRows: preview.sampleRows,
            columns: preview.columns
        };

    } catch (error) {
        logger.error(`Failed to get preview for ${datasetRef}: ${error.message}`);
        throw error;
    }
};

/**
 * Build reference context for Gemini prompt
 * @param {Object} sample - Sampled dataset
 * @param {Object} datasetInfo - Dataset metadata
 * @returns {Object} Reference context
 */
const buildReferenceContext = (sample, datasetInfo) => {
    if (!sample) {
        return null;
    }

    // Filter out noisy columns (IDs, timestamps, etc.)
    const relevantColumns = sample.columns.filter(col => {
        const name = col.name.toLowerCase();
        return !name.includes('id') &&
            !name.includes('timestamp') &&
            !name.includes('created') &&
            !name.includes('updated');
    });

    return {
        datasetName: datasetInfo.title,
        datasetRef: datasetInfo.ref,
        datasetUrl: normalizeDatasetRef(datasetInfo.ref).url,
        fileName: sample.fileName,
        totalRows: sample.totalRows,
        sampleSize: sample.sampleRows.length,
        columns: relevantColumns,
        sampleRows: sample.sampleRows.slice(0, 5) // Only include 5 sample rows
    };
};

/**
 * Get Kaggle reference for dataset generation
 * Main orchestration function (uses API preview, no downloads)
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @returns {Promise<Object|null>} Kaggle reference or null
 */
const getKaggleReference = async (topic, description) => {
    try {
        // Check cache first
        const cached = cacheService.getSearchResults(topic, description);
        if (cached) {
            logger.info('Using cached Kaggle reference');
            return cached;
        }

        // Search Kaggle datasets
        const datasets = await searchKaggleDatasets(topic, description);

        if (datasets.length === 0) {
            logger.warn('No Kaggle datasets found');
            return null;
        }

        // Rank datasets
        const rankedDatasets = rankDatasets(datasets, topic, description);

        if (rankedDatasets.length === 0) {
            return null;
        }

        // Try to get preview from top datasets (API-based, no download)
        for (const dataset of rankedDatasets) {
            try {
                // Check if already cached
                const cachedSample = cacheService.getDatasetSample(dataset.ref);
                if (cachedSample) {
                    logger.info(`Using cached sample for ${dataset.ref}`);
                    const reference = buildReferenceContext(cachedSample, dataset);
                    cacheService.setSearchResults(topic, description, reference);
                    return reference;
                }

                // Get preview using Kaggle API (no download!)
                const preview = await getDatasetPreviewAPI(dataset.ref);

                if (preview) {
                    // Cache the preview
                    cacheService.setDatasetSample(dataset.ref, preview);

                    // Build reference context
                    const reference = buildReferenceContext(preview, dataset);

                    // Cache the final reference
                    cacheService.setSearchResults(topic, description, reference);

                    logger.success(`Successfully created Kaggle reference from ${dataset.ref}`);
                    return reference;
                }

            } catch (error) {
                logger.warn(`Failed to process dataset ${dataset.ref}: ${error.message}`);
                continue; // Try next dataset
            }
        }

        logger.warn('Could not create Kaggle reference from any dataset');
        return null;

    } catch (error) {
        logger.error(`Error in getKaggleReference: ${error.message}`);
        return null;
    }
};

module.exports = {
    extractKeyTerms,
    searchKaggleDatasets,
    rankDatasets,
    getDatasetPreviewAPI,
    buildReferenceContext,
    getKaggleReference
};
