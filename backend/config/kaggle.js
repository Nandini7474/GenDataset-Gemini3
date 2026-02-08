const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');
const { setSecurePermissions } = require('../utils/filePermissions');

/**
 * Initialize Kaggle CLI environment
 * Creates ~/.kaggle/kaggle.json with credentials
 */
const initializeKaggle = async () => {
    try {
        const kaggleToken = process.env.KAGGLE_API_TOKEN;
        const kaggleUsername = process.env.KAGGLE_USERNAME;
        const kaggleKey = process.env.KAGGLE_KEY;

        // Determine which authentication method to use
        let credentials = null;

        if (kaggleToken) {
            // New token-based authentication
            logger.info('Using Kaggle API token authentication');
            credentials = {
                token: kaggleToken
            };
        } else if (kaggleUsername && kaggleKey) {
            // Traditional username/key authentication
            logger.info('Using Kaggle username/key authentication');
            credentials = {
                username: kaggleUsername,
                key: kaggleKey
            };
        } else {
            logger.warn('No Kaggle credentials found in environment variables');
            return false;
        }

        // Create ~/.kaggle directory
        const kaggleDir = path.join(os.homedir(), '.kaggle');
        await fs.mkdir(kaggleDir, { recursive: true });

        // Create kaggle.json file
        const kaggleJsonPath = path.join(kaggleDir, 'kaggle.json');
        await fs.writeFile(kaggleJsonPath, JSON.stringify(credentials, null, 2));

        // Set secure permissions (600)
        await setSecurePermissions(kaggleJsonPath);

        logger.success('Kaggle credentials configured successfully');
        return true;

    } catch (error) {
        logger.error(`Failed to initialize Kaggle: ${error.message}`);
        return false;
    }
};

/**
 * Check if Kaggle CLI is available
 * @returns {Promise<boolean>} True if available
 */
const isKaggleAvailable = async () => {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
        await execAsync('kaggle --version');
        return true;
    } catch (error) {
        logger.warn('Kaggle CLI is not available. Install with: pip install kaggle');
        return false;
    }
};

/**
 * Get Kaggle cache directory
 * @returns {string} Cache directory path
 */
const getKaggleCacheDir = () => {
    const cacheDir = process.env.KAGGLE_CACHE_DIR || './kaggle-cache';
    return path.resolve(cacheDir);
};

/**
 * Validate Kaggle configuration
 * @returns {Promise<Object>} Validation result
 */
const validateKaggleConfig = async () => {
    const result = {
        isConfigured: false,
        isCliAvailable: false,
        errors: []
    };

    // Check if credentials are configured
    const hasToken = !!process.env.KAGGLE_API_TOKEN;
    const hasUsernameKey = !!(process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY);

    if (!hasToken && !hasUsernameKey) {
        result.errors.push('No Kaggle credentials found in environment variables');
    } else {
        result.isConfigured = true;
    }

    // Check if CLI is available
    result.isCliAvailable = await isKaggleAvailable();
    if (!result.isCliAvailable) {
        result.errors.push('Kaggle CLI is not installed');
    }

    return result;
};

module.exports = {
    initializeKaggle,
    isKaggleAvailable,
    getKaggleCacheDir,
    validateKaggleConfig
};
