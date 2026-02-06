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
 * Search Kaggle datasets using CLI
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @returns {Promise<Array>} List of datasets
 */
const searchKaggleDatasets = async (topic, description) => {
    try {
        // Build search query
        const query = sanitizeSearchQuery(`${topic} ${description}`);

        if (!query) {
            logger.warn('Empty search query after sanitization');
            return [];
        }

        logger.info(`Searching Kaggle for: "${query}"`);

        // Execute Kaggle CLI search
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
        logger.success(`Found ${datasets.length} Kaggle datasets`);

        return datasets;

    } catch (error) {
        logger.error(`Kaggle search failed: ${error.message}`);
        return [];
    }
};

/**
 * Rank datasets based on relevance
 * @param {Array} datasets - List of datasets from search
 * @param {string} topic - Original topic
 * @param {string} description - Original description
 * @returns {Array} Ranked datasets (top 3)
 */
const rankDatasets = (datasets, topic, description) => {
    if (!datasets || datasets.length === 0) {
        return [];
    }

    const searchText = `${topic} ${description}`.toLowerCase();

    // Score each dataset
    const scored = datasets.map(dataset => {
        let score = 0;

        // Title similarity (weight: 40%)
        const titleSimilarity = calculateSimilarity(dataset.title, searchText);
        score += titleSimilarity * 40;

        // Popularity metrics (weight: 30%)
        const popularityScore = (
            Math.min(dataset.downloadCount / 1000, 10) +
            Math.min(dataset.voteCount / 100, 10)
        ) / 20;
        score += popularityScore * 30;

        // Usability rating (weight: 30%)
        score += (dataset.usabilityRating / 1.0) * 30;

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
 * Download Kaggle dataset
 * @param {string} datasetRef - Dataset reference (owner/name)
 * @returns {Promise<string>} Path to downloaded directory
 */
const downloadDataset = async (datasetRef) => {
    try {
        const cacheDir = getKaggleCacheDir();
        const datasetDir = path.join(cacheDir, datasetRef.replace('/', '_'));

        // Create directory
        await fs.mkdir(datasetDir, { recursive: true });

        logger.info(`Downloading Kaggle dataset: ${datasetRef}`);

        // Download using Kaggle CLI
        const command = `kaggle datasets download -d "${datasetRef}" -p "${datasetDir}" --unzip`;

        await Promise.race([
            execAsync(command),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Download timeout')), DOWNLOAD_TIMEOUT)
            )
        ]);

        logger.success(`Downloaded dataset to: ${datasetDir}`);
        return datasetDir;

    } catch (error) {
        logger.error(`Failed to download dataset ${datasetRef}: ${error.message}`);
        throw error;
    }
};

/**
 * Sample dataset files (CSV/JSON)
 * @param {string} datasetDir - Directory containing dataset files
 * @returns {Promise<Object>} Sampled data with schema
 */
const sampleDatasetFiles = async (datasetDir) => {
    try {
        // List all files in directory
        const files = await fs.readdir(datasetDir);

        // Filter for CSV and JSON files
        const dataFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.csv' || ext === '.json';
        });

        if (dataFiles.length === 0) {
            logger.warn('No CSV or JSON files found in dataset');
            return null;
        }

        // Try to parse the first suitable file
        for (const file of dataFiles) {
            try {
                const filePath = path.join(datasetDir, file);
                const ext = path.extname(file).toLowerCase().replace('.', '');

                // Check file size (skip if > 10MB)
                const stats = await fs.stat(filePath);
                if (stats.size > 10 * 1024 * 1024) {
                    logger.warn(`Skipping large file: ${file} (${stats.size} bytes)`);
                    continue;
                }

                logger.info(`Sampling file: ${file}`);

                // Parse file
                const parsedData = await parseSampleFile(filePath, ext);

                if (!parsedData || parsedData.length === 0) {
                    continue;
                }

                // Extract sample rows
                const sampleRows = extractSampleData(parsedData, MAX_SAMPLE_ROWS);

                // Infer column schema
                const columns = Object.keys(sampleRows[0] || {}).map(colName => {
                    const values = sampleRows.map(row => row[colName]);
                    const datatype = inferColumnType(values);

                    return {
                        name: colName,
                        datatype: datatype,
                        sampleValues: values.slice(0, 3) // First 3 values as examples
                    };
                });

                return {
                    fileName: file,
                    totalRows: parsedData.length,
                    sampleRows: sampleRows,
                    columns: columns
                };

            } catch (error) {
                logger.warn(`Failed to parse ${file}: ${error.message}`);
                continue;
            }
        }

        return null;

    } catch (error) {
        logger.error(`Failed to sample dataset files: ${error.message}`);
        return null;
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
 * Main orchestration function
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

        // Try to download and sample the top dataset
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

                // Download dataset
                const datasetDir = await downloadDataset(dataset.ref);

                // Sample files
                const sample = await sampleDatasetFiles(datasetDir);

                if (sample) {
                    // Cache the sample
                    cacheService.setDatasetSample(dataset.ref, sample);

                    // Build reference context
                    const reference = buildReferenceContext(sample, dataset);

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
    searchKaggleDatasets,
    rankDatasets,
    downloadDataset,
    sampleDatasetFiles,
    buildReferenceContext,
    getKaggleReference
};
