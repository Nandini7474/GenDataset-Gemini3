const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('../utils/logger');
const cacheService = require('../utils/cacheService');
const { sanitizeSearchQuery, parseKaggleListOutput } = require('../utils/kaggleHelpers');

const SEARCH_TIMEOUT = 30000; // 30 seconds

/**
 * Search Kaggle datasets and extract metadata ONLY (no downloads)
 * @param {string} topic - Dataset topic
 * @returns {Promise<Array>} List of dataset metadata
 */
const searchKaggleMetadata = async (topic) => {
    try {
        // Extract key terms from topic
        const query = sanitizeSearchQuery(topic);

        if (!query) {
            logger.warn('Empty search query after sanitization');
            return [];
        }

        logger.info(`Searching Kaggle metadata for: "${query}"`);

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

        // Extract metadata only
        return datasets.map(dataset => ({
            sourceType: 'kaggle',
            datasetName: dataset.title,
            datasetRef: dataset.ref,
            datasetUrl: `https://www.kaggle.com/datasets/${dataset.ref}`,
            description: dataset.subtitle || '',
            downloadCount: dataset.downloadCount || 0,
            voteCount: dataset.voteCount || 0,
            usabilityRating: dataset.usabilityRating || 0,
            tags: [], // Kaggle CLI doesn't provide tags in list output
            relevanceScore: 0 // Will be calculated by ranking
        }));

    } catch (error) {
        logger.error(`Kaggle metadata search failed: ${error.message}`);
        return [];
    }
};

/**
 * Rank datasets by relevance to topic
 * @param {Array} datasets - List of datasets
 * @param {string} topic - Original topic
 * @returns {Array} Top 3 ranked datasets
 */
const rankDatasetsByRelevance = (datasets, topic) => {
    if (!datasets || datasets.length === 0) {
        return [];
    }

    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 2);

    // Score each dataset
    const scored = datasets.map(dataset => {
        let score = 0;
        const titleLower = dataset.datasetName.toLowerCase();
        const descLower = (dataset.description || '').toLowerCase();

        // Exact phrase match in title (weight: 40%)
        if (titleLower.includes(topicLower)) {
            score += 40;
        }

        // Individual word matches in title (weight: 25%)
        const titleMatches = topicWords.filter(word => titleLower.includes(word)).length;
        score += (titleMatches / Math.max(topicWords.length, 1)) * 25;

        // Word matches in description (weight: 15%)
        const descMatches = topicWords.filter(word => descLower.includes(word)).length;
        score += (descMatches / Math.max(topicWords.length, 1)) * 15;

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
            relevanceScore: Math.round(score * 100) / 100
        };
    });

    // Sort by score descending
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 3
    const topDatasets = scored.slice(0, 3);

    logger.info(`Top ranked datasets: ${topDatasets.map(d => `${d.datasetRef} (${d.relevanceScore})`).join(', ')}`);

    return topDatasets;
};

/**
 * Get Kaggle metadata for a topic (cached)
 * @param {string} topic - Dataset topic
 * @returns {Promise<Array>} Top 3 relevant dataset metadata
 */
const getKaggleMetadata = async (topic) => {
    try {
        // Check cache
        const cacheKey = `kaggle_metadata:${topic.toLowerCase().trim()}`;
        const cached = cacheService.searchCache.get(cacheKey);

        if (cached) {
            logger.info('Using cached Kaggle metadata');
            return cached;
        }

        // Search for datasets
        const datasets = await searchKaggleMetadata(topic);

        if (datasets.length === 0) {
            logger.warn('No Kaggle datasets found');
            return [];
        }

        // Rank by relevance
        const ranked = rankDatasetsByRelevance(datasets, topic);

        // Cache results (1 hour)
        cacheService.searchCache.set(cacheKey, ranked);

        logger.success(`Retrieved ${ranked.length} Kaggle metadata entries`);
        return ranked;

    } catch (error) {
        logger.error(`Error getting Kaggle metadata: ${error.message}`);
        return [];
    }
};

/**
 * Build relevance summary from metadata
 * @param {Object} metadata - Dataset metadata
 * @returns {string} Human-readable summary
 */
const buildRelevanceSummary = (metadata) => {
    const parts = [];

    if (metadata.description) {
        parts.push(metadata.description.substring(0, 100));
    }

    if (metadata.downloadCount > 1000) {
        parts.push(`${Math.round(metadata.downloadCount / 1000)}k+ downloads`);
    }

    if (metadata.relevanceScore > 50) {
        parts.push('highly relevant');
    }

    return parts.join(' • ') || 'Related dataset';
};

module.exports = {
    searchKaggleMetadata,
    rankDatasetsByRelevance,
    getKaggleMetadata,
    buildRelevanceSummary
};
