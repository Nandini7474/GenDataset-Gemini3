const { getGeminiModel } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Build the prompt for Gemini
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @param {Array} columns - Column definitions
 * @param {number} rowCount - Number of rows
 * @param {string|null} referenceContext - Formatted reference context string
 * @returns {string} The constructed prompt
 */
const buildPrompt = (topic, description, columns, rowCount, referenceContext) => {
    const columnSpecs = columns.map(col =>
        `- ${col.name} (${col.datatype}): ${col.examples || 'generate realistic values'}`
    ).join('\n');

    let prompt = `Generate a realistic dataset for the topic: "${topic}"\n`;
    prompt += `Description: ${description}\n\n`;

    // Add reference context if available
    if (referenceContext) {
        prompt += referenceContext;
    }

    prompt += `SPECIFICATIONS:\n`;
    prompt += `Columns:\n${columnSpecs}\n\n`;
    prompt += `Number of rows: ${rowCount}\n\n`;

    prompt += `OUTPUT FORMAT:\n`;
    prompt += `Return ONLY a valid JSON array of objects. Each object should represent one row.\n`;
    prompt += `Do not include markdown formatting, code blocks, or explanations.\n`;
    prompt += `Example: [{"col1": "val1", "col2": 10}, ...]\n`;

    return prompt;
};

/**
 * Generate dataset using Gemini
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @param {Array} columns - Column definitions
 * @param {number} rowCount - Number of rows
 * @param {string|null} referenceContext - Reference context for improved generation
 * @returns {Promise<Array>} The generated dataset
 */
const generateDataset = async (topic, description, columns, rowCount, referenceContext = null) => {
    try {
        const model = getGeminiModel();

        logger.info(`Generating dataset for topic: ${topic} with ${rowCount} rows`);

        const prompt = buildPrompt(topic, description, columns, rowCount, referenceContext);

        logger.debug(`Prompt built: ${prompt.substring(0, 500)}...`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response (remove code blocks if present)
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const dataset = JSON.parse(cleanedText);

            if (!Array.isArray(dataset)) {
                throw new Error('Response is not an array');
            }

            // Validate row count (Gemini might generate slightly different count)
            if (dataset.length !== rowCount) {
                logger.warn(`Generated ${dataset.length} rows, requested ${rowCount}`);
            }

            logger.success(`Successfully generated ${dataset.length} rows`);
            return dataset;

        } catch (parseError) {
            logger.error(`Failed to parse Gemini response: ${parseError.message}`);
            logger.debug(`Raw response: ${text.substring(0, 200)}...`);
            throw new Error('Failed to generate valid JSON dataset');
        }

    } catch (error) {
        logger.error(`Gemini generation failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    buildPrompt,
    generateDataset
};
