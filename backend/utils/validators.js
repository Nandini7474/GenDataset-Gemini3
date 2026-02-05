/**
 * Supported data types for dataset columns
 */
const SUPPORTED_DATATYPES = [
    'string',
    'number',
    'integer',
    'float',
    'boolean',
    'date',
    'email',
    'phone',
    'url',
    'address',
    'name',
    'percentage',
    'currency'
];

/**
 * Validate if datatype is supported
 * @param {string} datatype - Datatype to validate
 * @returns {boolean} True if valid
 */
const isValidDatatype = (datatype) => {
    return SUPPORTED_DATATYPES.includes(datatype.toLowerCase());
};

/**
 * Validate column schema
 * @param {Object} column - Column object with name and datatype
 * @returns {Object} Validation result
 */
const validateColumn = (column) => {
    const errors = [];

    if (!column.name || typeof column.name !== 'string') {
        errors.push('Column name is required and must be a string');
    }

    if (!column.datatype || typeof column.datatype !== 'string') {
        errors.push('Column datatype is required and must be a string');
    } else if (!isValidDatatype(column.datatype)) {
        errors.push(`Invalid datatype: ${column.datatype}. Supported types: ${SUPPORTED_DATATYPES.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate array of columns
 * @param {Array} columns - Array of column objects
 * @returns {Object} Validation result
 */
const validateColumns = (columns) => {
    if (!Array.isArray(columns)) {
        return {
            isValid: false,
            errors: ['Columns must be an array']
        };
    }

    if (columns.length === 0) {
        return {
            isValid: false,
            errors: ['At least one column is required']
        };
    }

    if (columns.length > 50) {
        return {
            isValid: false,
            errors: ['Maximum 50 columns allowed']
        };
    }

    const allErrors = [];
    columns.forEach((column, index) => {
        const validation = validateColumn(column);
        if (!validation.isValid) {
            allErrors.push(`Column ${index + 1}: ${validation.errors.join(', ')}`);
        }
    });

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
};

/**
 * Validate row count
 * @param {number} rowCount - Number of rows to generate
 * @returns {Object} Validation result
 */
const validateRowCount = (rowCount) => {
    const errors = [];

    if (typeof rowCount !== 'number' || isNaN(rowCount)) {
        errors.push('Row count must be a valid number');
    } else {
        if (rowCount < 1) {
            errors.push('Row count must be at least 1');
        }
        if (rowCount > 1000) {
            errors.push('Row count cannot exceed 1000');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

module.exports = {
    SUPPORTED_DATATYPES,
    isValidDatatype,
    validateColumn,
    validateColumns,
    validateRowCount,
    isValidEmail,
    isValidUrl
};
