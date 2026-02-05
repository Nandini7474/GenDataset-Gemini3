const { getGeminiModel } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Build a detailed prompt for Gemini to generate dataset
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @param {Array} columns - Array of column objects {name, datatype}
 * @param {number} rowCount - Number of rows to generate
 * @param {Array} sampleData - Optional sample data for context
 * @returns {string} Formatted prompt
 */
const buildPrompt = (topic, description, columns, rowCount, sampleData = null) => {
    let prompt = `You are a professional data generator. Generate a realistic dataset based on the following specifications:

**Topic:** ${topic}

**Description:** ${description}

**Columns:**
${columns.map((col, idx) => `${idx + 1}. ${col.name} (${col.datatype})`).join('\n')}

**Number of Rows:** ${rowCount}

`;

    if (sampleData && sampleData.length > 0) {
        prompt += `**Sample Data for Reference:**
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

`;
    }

    prompt += `**Instructions:**
1. Generate EXACTLY ${rowCount} rows of realistic data
2. Each row must be a JSON object with keys matching the column names exactly
3. Ensure data types match the specified column datatypes:
   - string: text values
   - number/integer/float: numeric values
   - boolean: true or false
   - date: ISO 8601 format (YYYY-MM-DD or full timestamp)
   - email: valid email addresses
   - phone: valid phone numbers with country code
   - url: valid URLs starting with http:// or https://
   - address: complete street addresses
   - name: realistic full names
   - percentage: numeric values between 0-100
   - currency: numeric values with 2 decimal places

4. Make the data realistic and contextually relevant to the topic
5. Ensure variety in the generated data (avoid repetitive patterns)
6. Return ONLY a valid JSON array of objects, no additional text or explanation

**Output Format:**
[
  { "column1": "value1", "column2": "value2", ... },
  { "column1": "value1", "column2": "value2", ... },
  ...
]

Generate the dataset now:`;

    return prompt;
};

/**
 * Parse and validate Gemini response
 * @param {string} responseText - Raw response from Gemini
 * @returns {Array} Parsed dataset array
 */
const parseGeminiResponse = (responseText) => {
    try {
        // Remove markdown code blocks if present
        let cleanedText = responseText.trim();

        // Remove ```json and ``` markers
        cleanedText = cleanedText.replace(/```json\s*/gi, '');
        cleanedText = cleanedText.replace(/```\s*/g, '');

        // Try to find JSON array in the response
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(parsedData)) {
            throw new Error('Response is not an array');
        }

        if (parsedData.length === 0) {
            throw new Error('Generated dataset is empty');
        }

        return parsedData;
    } catch (error) {
        logger.error(`Error parsing Gemini response: ${error.message}`);
        throw new Error(`Failed to parse AI response: ${error.message}`);
    }
};

/**
 * Generate dataset using Gemini API
 * @param {Object} params - Generation parameters
 * @param {string} params.topic - Dataset topic
 * @param {string} params.description - Dataset description
 * @param {Array} params.columns - Column definitions
 * @param {number} params.rowCount - Number of rows
 * @param {Array} params.sampleData - Optional sample data
 * @returns {Promise<Array>} Generated dataset
 */
const generateDataset = async ({ topic, description, columns, rowCount, sampleData }) => {
    try {
        logger.info(`Generating dataset for topic: ${topic} with ${rowCount} rows`);

        // Build the prompt
        const prompt = buildPrompt(topic, description, columns, rowCount, sampleData);
        logger.debug(`Prompt built: ${prompt.substring(0, 200)}...`);

        // Get Gemini model
        const model = getGeminiModel();

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        logger.debug(`Gemini response received: ${text.substring(0, 200)}...`);

        // Parse and validate response
        const dataset = parseGeminiResponse(text);

        logger.success(`Successfully generated ${dataset.length} rows`);
        return dataset;

    } catch (error) {
        logger.error(`Error generating dataset: ${error.message}`);
        throw new Error(`Dataset generation failed: ${error.message}`);
    }
};

module.exports = {
    buildPrompt,
    parseGeminiResponse,
    generateDataset
};
