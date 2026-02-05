const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Initialize Gemini API client
 */
let genAI = null;
let model = null;

const initializeGemini = () => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }

        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Using Gemini 3 Pro Preview model
        model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            }
        });

        logger.info('Gemini API initialized successfully');
        return model;
    } catch (error) {
        logger.error(`Error initializing Gemini API: ${error.message}`);
        throw error;
    }
};

/**
 * Get Gemini model instance
 * @returns {Object} Gemini model instance
 */
const getGeminiModel = () => {
    if (!model) {
        return initializeGemini();
    }
    return model;
};

module.exports = {
    initializeGemini,
    getGeminiModel
};
