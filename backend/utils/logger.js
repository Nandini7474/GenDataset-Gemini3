const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

/**
 * Get formatted timestamp
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Logger utility for console logging with timestamps and colors
 */
const logger = {
    /**
     * Log info message
     * @param {string} message - Message to log
     */
    info: (message) => {
        console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.bright}${getTimestamp()}${colors.reset} - ${message}`);
    },

    /**
     * Log success message
     * @param {string} message - Message to log
     */
    success: (message) => {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.bright}${getTimestamp()}${colors.reset} - ${message}`);
    },

    /**
     * Log warning message
     * @param {string} message - Message to log
     */
    warn: (message) => {
        console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.bright}${getTimestamp()}${colors.reset} - ${message}`);
    },

    /**
     * Log error message
     * @param {string} message - Message to log
     */
    error: (message) => {
        console.error(`${colors.red}[ERROR]${colors.reset} ${colors.bright}${getTimestamp()}${colors.reset} - ${message}`);
    },

    /**
     * Log debug message
     * @param {string} message - Message to log
     */
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.magenta}[DEBUG]${colors.reset} ${colors.bright}${getTimestamp()}${colors.reset} - ${message}`);
        }
    }
};

module.exports = logger;
