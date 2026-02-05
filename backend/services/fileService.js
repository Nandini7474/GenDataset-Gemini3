const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const logger = require('../utils/logger');

/**
 * Parse CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed data array
 */
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];

        createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                logger.info(`CSV file parsed: ${results.length} rows`);
                resolve(results);
            })
            .on('error', (error) => {
                logger.error(`Error parsing CSV: ${error.message}`);
                reject(error);
            });
    });
};

/**
 * Parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Array>} Parsed data array
 */
const parseJSON = async (filePath) => {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        if (!Array.isArray(data)) {
            throw new Error('JSON file must contain an array of objects');
        }

        logger.info(`JSON file parsed: ${data.length} rows`);
        return data;
    } catch (error) {
        logger.error(`Error parsing JSON: ${error.message}`);
        throw new Error(`Failed to parse JSON file: ${error.message}`);
    }
};

/**
 * Parse sample file based on file type
 * @param {string} filePath - Path to file
 * @param {string} fileType - File extension (csv or json)
 * @returns {Promise<Array>} Parsed data
 */
const parseSampleFile = async (filePath, fileType) => {
    try {
        const normalizedType = fileType.toLowerCase().replace('.', '');

        if (normalizedType === 'csv') {
            return await parseCSV(filePath);
        } else if (normalizedType === 'json') {
            return await parseJSON(filePath);
        } else {
            throw new Error(`Unsupported file type: ${fileType}`);
        }
    } catch (error) {
        logger.error(`Error parsing sample file: ${error.message}`);
        throw error;
    }
};

/**
 * Extract sample data from parsed data
 * @param {Array} parsedData - Full parsed data array
 * @param {number} limit - Maximum number of sample rows (default: 5)
 * @returns {Array} Sample data subset
 */
const extractSampleData = (parsedData, limit = 5) => {
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
        return [];
    }

    return parsedData.slice(0, Math.min(limit, parsedData.length));
};

/**
 * Validate file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if file exists
 */
const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase().replace('.', '');
};

module.exports = {
    parseCSV,
    parseJSON,
    parseSampleFile,
    extractSampleData,
    fileExists,
    getFileExtension
};
