const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * In-memory cache for Kaggle search results and dataset samples
 * TTL: 1 hour for searches, 24 hours for dataset samples
 */
class CacheService {
    constructor() {
        // Cache for Kaggle search results (1 hour TTL)
        this.searchCache = new NodeCache({
            stdTTL: 3600, // 1 hour
            checkperiod: 600 // Check for expired keys every 10 minutes
        });

        // Cache for dataset samples (24 hour TTL)
        this.datasetCache = new NodeCache({
            stdTTL: 86400, // 24 hours
            checkperiod: 3600 // Check every hour
        });
    }

    /**
     * Generate cache key from topic only
     * @param {string} topic - Dataset topic
     * @param {string} description - Dataset description (kept for compatibility but not used)
     * @returns {string} Cache key
     */
    generateSearchKey(topic, description) {
        // Use only topic for cache key (ignore description)
        const key = topic.toLowerCase().trim();
        return `search:${key}`;
    }

    /**
     * Generate cache key for dataset
     * @param {string} datasetRef - Dataset reference
     * @returns {string} Cache key
     */
    generateDatasetKey(datasetRef) {
        return `dataset:${datasetRef}`;
    }

    /**
     * Get cached search results
     * @param {string} topic - Dataset topic
     * @param {string} description - Dataset description
     * @returns {Object|null} Cached results or null
     */
    getSearchResults(topic, description) {
        const key = this.generateSearchKey(topic, description);
        const cached = this.searchCache.get(key);

        if (cached) {
            logger.debug(`Cache HIT for search: ${key}`);
            return cached;
        }

        logger.debug(`Cache MISS for search: ${key}`);
        return null;
    }

    /**
     * Set search results in cache
     * @param {string} topic - Dataset topic
     * @param {string} description - Dataset description
     * @param {Object} results - Search results to cache
     */
    setSearchResults(topic, description, results) {
        const key = this.generateSearchKey(topic, description);
        this.searchCache.set(key, results);
        logger.debug(`Cached search results: ${key}`);
    }

    /**
     * Get cached dataset sample
     * @param {string} datasetRef - Dataset reference
     * @returns {Object|null} Cached dataset or null
     */
    getDatasetSample(datasetRef) {
        const key = this.generateDatasetKey(datasetRef);
        const cached = this.datasetCache.get(key);

        if (cached) {
            logger.debug(`Cache HIT for dataset: ${key}`);
            return cached;
        }

        logger.debug(`Cache MISS for dataset: ${key}`);
        return null;
    }

    /**
     * Set dataset sample in cache
     * @param {string} datasetRef - Dataset reference
     * @param {Object} sample - Dataset sample to cache
     */
    setDatasetSample(datasetRef, sample) {
        const key = this.generateDatasetKey(datasetRef);
        this.datasetCache.set(key, sample);
        logger.debug(`Cached dataset sample: ${key}`);
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.searchCache.flushAll();
        this.datasetCache.flushAll();
        logger.info('All caches cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            search: this.searchCache.getStats(),
            dataset: this.datasetCache.getStats()
        };
    }
}

// Export singleton instance
module.exports = new CacheService();
