const axios = require('axios');
const logger = require('../utils/logger');
const cacheService = require('../utils/cacheService');
const { inferColumnType } = require('../utils/kaggleHelpers');

/**
 * Hugging Face Datasets API base URL
 */
const HF_API_BASE = 'https://datasets-server.huggingface.co';
const HF_SEARCH_API = 'https://huggingface.co/api/datasets';

/**
 * Search Hugging Face datasets
 * @param {string} topic - Search topic
 * @returns {Promise<Array>} List of matching datasets
 */
const searchHuggingFaceDatasets = async (topic) => {
    try {
        logger.info(`Searching Hugging Face for: "${topic}"`);

        const response = await axios.get(HF_SEARCH_API, {
            params: {
                search: topic,
                limit: 5
            },
            timeout: 10000
        });

        const datasets = response.data || [];
        logger.success(`Found ${datasets.length} Hugging Face datasets`);

        return datasets.map(ds => ({
            id: ds.id,
            author: ds.author || 'unknown',
            name: ds.id.split('/').pop(),
            downloads: ds.downloads || 0,
            likes: ds.likes || 0
        }));

    } catch (error) {
        logger.warn(`Hugging Face search failed: ${error.message}`);
        return [];
    }
};

/**
 * Fetch sample rows from Hugging Face dataset
 * @param {string} datasetId - Dataset ID (e.g., "username/dataset-name")
 * @param {number} limit - Max rows to fetch (default: 20)
 * @returns {Promise<Object|null>} Sample data or null
 */
const fetchHuggingFaceSamples = async (datasetId, limit = 20) => {
    try {
        logger.info(`Fetching samples from HF dataset: ${datasetId}`);

        // Try to get first rows from the dataset
        const response = await axios.get(`${HF_API_BASE}/first-rows`, {
            params: {
                dataset: datasetId,
                config: 'default',
                split: 'train'
            },
            timeout: 15000
        });

        const data = response.data;

        if (!data || !data.rows || data.rows.length === 0) {
            logger.warn(`No rows found in HF dataset: ${datasetId}`);
            return null;
        }

        // Extract rows
        const rows = data.rows.slice(0, limit).map(r => r.row);

        // Infer columns
        const firstRow = rows[0];
        const columns = Object.keys(firstRow).map(colName => {
            const values = rows.map(row => row[colName]);
            const datatype = inferColumnType(values);

            return {
                name: colName,
                datatype: datatype,
                sampleValues: values.slice(0, 3)
            };
        });

        logger.success(`Fetched ${rows.length} sample rows from HF`);

        return {
            sourceType: 'huggingface',
            datasetName: datasetId.split('/').pop(),
            datasetUrl: `https://huggingface.co/datasets/${datasetId}`,
            sampleRows: rows,
            columns: columns,
            totalRows: rows.length
        };

    } catch (error) {
        logger.warn(`Failed to fetch HF samples for ${datasetId}: ${error.message}`);
        return null;
    }
};

/**
 * Get Hugging Face dataset samples for a topic
 * @param {string} topic - Search topic
 * @returns {Promise<Object|null>} Sample data or null
 */
const getHuggingFaceSamples = async (topic) => {
    try {
        // Check cache
        const cacheKey = `hf_samples:${topic.toLowerCase().trim()}`;
        const cached = cacheService.datasetCache.get(cacheKey);

        if (cached) {
            logger.info('Using cached Hugging Face samples');
            return cached;
        }

        // Search for datasets
        const datasets = await searchHuggingFaceDatasets(topic);

        if (datasets.length === 0) {
            return null;
        }

        // Try to fetch samples from top dataset
        for (const dataset of datasets.slice(0, 3)) {
            const samples = await fetchHuggingFaceSamples(dataset.id);

            if (samples) {
                // Cache results (24 hours)
                cacheService.datasetCache.set(cacheKey, samples);
                return samples;
            }
        }

        return null;

    } catch (error) {
        logger.error(`Error getting HF samples: ${error.message}`);
        return null;
    }
};

/**
 * Extract column patterns from samples
 * @param {Array} samples - Sample rows
 * @returns {Object} Column patterns
 */
const extractColumnPatterns = (samples) => {
    if (!samples || samples.length === 0) {
        return {};
    }

    const patterns = {};
    const firstRow = samples[0];

    Object.keys(firstRow).forEach(colName => {
        const values = samples.map(row => row[colName]).filter(v => v != null);

        if (values.length === 0) return;

        patterns[colName] = {
            datatype: inferColumnType(values),
            uniqueCount: new Set(values).size,
            nullCount: samples.length - values.length,
            sampleValues: values.slice(0, 5),
            valueRange: getValueRange(values)
        };
    });

    return patterns;
};

/**
 * Get value range for numeric/date columns
 * @param {Array} values - Column values
 * @returns {Object|null} Range info
 */
const getValueRange = (values) => {
    // Try to parse as numbers
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));

    if (numbers.length > values.length * 0.5) {
        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            avg: numbers.reduce((a, b) => a + b, 0) / numbers.length
        };
    }

    return null;
};

module.exports = {
    searchHuggingFaceDatasets,
    fetchHuggingFaceSamples,
    getHuggingFaceSamples,
    extractColumnPatterns
};
