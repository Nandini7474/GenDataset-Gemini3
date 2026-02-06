const fs = require('fs');
const path = require('path');

/**
 * Set secure file permissions (600) on a file
 * Cross-platform support for Windows and Unix-like systems
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if successful
 */
const setSecurePermissions = async (filePath) => {
    try {
        // On Unix-like systems (Linux, macOS), set permissions to 600 (rw-------)
        if (process.platform !== 'win32') {
            await fs.promises.chmod(filePath, 0o600);
        } else {
            // On Windows, we can't set Unix-style permissions
            // But we can ensure the file is not read-only
            const stats = await fs.promises.stat(filePath);
            if (stats.mode & 0o200) {
                // File is writable, which is good enough for Windows
                return true;
            }
        }
        return true;
    } catch (error) {
        throw new Error(`Failed to set secure permissions on ${filePath}: ${error.message}`);
    }
};

/**
 * Check if file has secure permissions
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if permissions are secure
 */
const hasSecurePermissions = async (filePath) => {
    try {
        if (process.platform !== 'win32') {
            const stats = await fs.promises.stat(filePath);
            const mode = stats.mode & parseInt('777', 8);
            return mode === parseInt('600', 8);
        }
        return true; // On Windows, we assume it's secure if it exists
    } catch (error) {
        return false;
    }
};

module.exports = {
    setSecurePermissions,
    hasSecurePermissions
};
