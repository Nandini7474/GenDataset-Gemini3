const { body, query, validationResult } = require('express-validator');
const { validateColumns, validateRowCount } = require('../utils/validators');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules for dataset generation
 */
const validateGenerateDataset = [
    body('topic')
        .trim()
        .notEmpty().withMessage('Topic is required')
        .isLength({ max: 200 }).withMessage('Topic cannot exceed 200 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

    body('columns')
        .isArray({ min: 1 }).withMessage('At least one column is required')
        .custom((columns) => {
            const validation = validateColumns(columns);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }
            return true;
        }),

    body('rowCount')
        .isInt().withMessage('Row count must be an integer')
        .custom((rowCount) => {
            const validation = validateRowCount(rowCount);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'topic', 'rowCount']).withMessage('Invalid sort field'),

    handleValidationErrors
];

/**
 * Sanitize input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Remove potentially dangerous characters
                req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
        });
    }
    next();
};

module.exports = {
    validateGenerateDataset,
    validatePagination,
    sanitizeInput,
    handleValidationErrors
};
