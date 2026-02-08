const path = require('path');
const AdmZip = require('adm-zip');

/**
 * Sanitize search query to prevent CLI injection
 * @param {string} query - Raw search query
 * @returns {string} Sanitized query
 */
const sanitizeSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
        return '';
    }

    // Remove potentially dangerous characters
    // Allow: alphanumeric, spaces, hyphens, underscores, commas
    const sanitized = query
        .replace(/[^a-zA-Z0-9\s\-_,]/g, '')
        .trim()
        .substring(0, 200); // Limit length

    return sanitized;
};

/**
 * Parse Kaggle CLI list output to JSON
 * Expected format: ref, title, size, lastUpdated, downloadCount, voteCount, usabilityRating
 * @param {string} output - Raw CLI output
 * @returns {Array} Parsed datasets
 */
const parseKaggleListOutput = (output) => {
    try {
        const lines = output.trim().split('\n');
        const datasets = [];

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by multiple spaces (Kaggle CLI uses space-separated columns)
            const parts = line.split(/\s{2,}/);

            if (parts.length >= 3) {
                datasets.push({
                    ref: parts[0]?.trim() || '',
                    title: parts[1]?.trim() || '',
                    size: parts[2]?.trim() || '',
                    lastUpdated: parts[3]?.trim() || '',
                    downloadCount: parseInt(parts[4]?.trim()) || 0,
                    voteCount: parseInt(parts[5]?.trim()) || 0,
                    usabilityRating: parseFloat(parts[6]?.trim()) || 0
                });
            }
        }

        return datasets;
    } catch (error) {
        throw new Error(`Failed to parse Kaggle output: ${error.message}`);
    }
};

/**
 * Infer column datatype from sample values
 * @param {Array} values - Sample values from a column
 * @returns {string} Inferred datatype
 */
const inferColumnType = (values) => {
    if (!values || values.length === 0) {
        return 'string';
    }

    // Filter out null/undefined values
    const validValues = values.filter(v => v !== null && v !== undefined && v !== '');

    if (validValues.length === 0) {
        return 'string';
    }

    // Check for boolean
    const booleanPattern = /^(true|false|yes|no|0|1)$/i;
    if (validValues.every(v => booleanPattern.test(String(v)))) {
        return 'boolean';
    }

    // Check for number
    const numberPattern = /^-?\d+\.?\d*$/;
    if (validValues.every(v => numberPattern.test(String(v)))) {
        // Check if integer or float
        const hasDecimal = validValues.some(v => String(v).includes('.'));
        return hasDecimal ? 'float' : 'integer';
    }

    // Check for date
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    if (validValues.some(v => datePattern.test(String(v)))) {
        return 'date';
    }

    // Check for email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (validValues.some(v => emailPattern.test(String(v)))) {
        return 'email';
    }

    // Check for URL
    const urlPattern = /^https?:\/\//;
    if (validValues.some(v => urlPattern.test(String(v)))) {
        return 'url';
    }

    // Check for phone
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    if (validValues.some(v => phonePattern.test(String(v)) && String(v).length >= 10)) {
        return 'phone';
    }

    // Default to string
    return 'string';
};

/**
 * Normalize dataset reference format
 * @param {string} ref - Dataset reference (owner/dataset-name)
 * @returns {Object} Normalized reference
 */
const normalizeDatasetRef = (ref) => {
    if (!ref || typeof ref !== 'string') {
        throw new Error('Invalid dataset reference');
    }

    const parts = ref.split('/');
    if (parts.length !== 2) {
        throw new Error('Dataset reference must be in format: owner/dataset-name');
    }

    return {
        owner: parts[0],
        name: parts[1],
        ref: ref,
        url: `https://www.kaggle.com/datasets/${ref}`
    };
};

/**
 * Extract ZIP file
 * @param {string} zipPath - Path to ZIP file
 * @param {string} extractPath - Directory to extract to
 * @returns {Promise<Array>} List of extracted files
 */
const extractZipFile = async (zipPath, extractPath) => {
    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const zipEntries = zip.getEntries();
        const extractedFiles = zipEntries
            .filter(entry => !entry.isDirectory)
            .map(entry => path.join(extractPath, entry.entryName));

        return extractedFiles;
    } catch (error) {
        throw new Error(`Failed to extract ZIP file: ${error.message}`);
    }
};

/**
 * Calculate similarity score between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Simple word-based similarity
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    let matches = 0;
    words1.forEach(word => {
        if (words2.includes(word)) {
            matches++;
        }
    });

    return matches / Math.max(words1.length, words2.length);
};

module.exports = {
    sanitizeSearchQuery,
    parseKaggleListOutput,
    inferColumnType,
    normalizeDatasetRef,
    extractZipFile,
    calculateSimilarity
};
