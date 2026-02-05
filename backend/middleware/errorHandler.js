const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'APIError';
    }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.statusCode = 400;
        this.errors = errors;
        this.name = 'ValidationError';
    }
}

/**
 * Error handler middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    logger.debug(`Stack trace: ${err.stack}`);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Response object
    const response = {
        success: false,
        error: message
    };

    // Add errors array if exists
    if (errors.length > 0) {
        response.errors = errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    const error = new APIError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

module.exports = {
    APIError,
    ValidationError,
    errorHandler,
    notFound
};
