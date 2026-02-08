const logger = require('../utils/logger');
const { getKaggleMetadata, buildRelevanceSummary } = require('./kaggleMetadataService');
const { getHuggingFaceSamples, extractColumnPatterns } = require('./openDatasetService');

/**
 * Build comprehensive reference context from multiple sources
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @returns {Promise<Object>} Reference context
 */
const buildReferenceContext = async (topic, description) => {
    try {
        logger.info(`Building reference context for: "${topic}"`);

        const context = {
            referenceSources: [],
            columnPatterns: {},
            valueExamples: {},
            semanticHints: []
        };

        // 1. Get Kaggle metadata (no downloads)
        const kaggleMetadata = await getKaggleMetadata(topic);

        if (kaggleMetadata && kaggleMetadata.length > 0) {
            kaggleMetadata.forEach(meta => {
                context.referenceSources.push({
                    sourceType: 'kaggle',
                    datasetName: meta.datasetName,
                    datasetUrl: meta.datasetUrl,
                    relevanceSummary: buildRelevanceSummary(meta),
                    relevanceScore: meta.relevanceScore
                });
            });

            logger.success(`Added ${kaggleMetadata.length} Kaggle metadata sources`);
        }

        // 2. Get Hugging Face samples
        const hfSamples = await getHuggingFaceSamples(topic);

        if (hfSamples) {
            context.referenceSources.push({
                sourceType: 'huggingface',
                datasetName: hfSamples.datasetName,
                datasetUrl: hfSamples.datasetUrl,
                relevanceSummary: `${hfSamples.totalRows} sample rows with ${hfSamples.columns.length} columns`
            });

            // Extract column patterns from samples
            context.columnPatterns = extractColumnPatterns(hfSamples.sampleRows);

            // Extract value examples
            hfSamples.columns.forEach(col => {
                context.valueExamples[col.name] = {
                    datatype: col.datatype,
                    examples: col.sampleValues
                };
            });

            logger.success('Added Hugging Face sample data');
        }

        // 3. Generate semantic hints
        context.semanticHints = generateSemanticHints(topic, description, context);

        logger.success(`Built reference context with ${context.referenceSources.length} sources`);

        return context;

    } catch (error) {
        logger.error(`Error building reference context: ${error.message}`);

        // Return empty context on error (graceful degradation)
        return {
            referenceSources: [],
            columnPatterns: {},
            valueExamples: {},
            semanticHints: []
        };
    }
};

/**
 * Generate semantic hints based on topic and available data
 * @param {string} topic - Dataset topic
 * @param {string} description - Dataset description
 * @param {Object} context - Current context
 * @returns {Array} Semantic hints
 */
const generateSemanticHints = (topic, description, context) => {
    const hints = [];
    const topicLower = topic.toLowerCase();

    // Domain-specific hints
    if (topicLower.includes('ecommerce') || topicLower.includes('product') || topicLower.includes('shop')) {
        hints.push('Include product identifiers, names, categories, and pricing');
        hints.push('Consider inventory levels, ratings, and reviews');
        hints.push('Use realistic price ranges for product categories');
    }

    if (topicLower.includes('social') || topicLower.includes('media') || topicLower.includes('post')) {
        hints.push('Include engagement metrics (likes, shares, comments)');
        hints.push('Consider temporal patterns (posting times, dates)');
        hints.push('Use realistic engagement rate distributions');
    }

    if (topicLower.includes('user') || topicLower.includes('customer') || topicLower.includes('account')) {
        hints.push('Include user identifiers and demographic information');
        hints.push('Consider registration dates and activity timestamps');
        hints.push('Use realistic email and name formats');
    }

    if (topicLower.includes('sales') || topicLower.includes('transaction') || topicLower.includes('order')) {
        hints.push('Include transaction IDs, amounts, and timestamps');
        hints.push('Consider payment methods and order statuses');
        hints.push('Use realistic transaction value distributions');
    }

    // Column pattern hints
    if (Object.keys(context.columnPatterns).length > 0) {
        const columnNames = Object.keys(context.columnPatterns);
        hints.push(`Common columns in similar datasets: ${columnNames.slice(0, 5).join(', ')}`);
    }

    // Value range hints
    Object.entries(context.columnPatterns).forEach(([colName, pattern]) => {
        if (pattern.valueRange) {
            hints.push(`${colName}: typical range ${pattern.valueRange.min} to ${pattern.valueRange.max}`);
        }
    });

    return hints.slice(0, 10); // Limit to 10 hints
};

/**
 * Format reference context for Gemini prompt
 * @param {Object} context - Reference context
 * @returns {string} Formatted context string
 */
const formatContextForPrompt = (context) => {
    if (!context || context.referenceSources.length === 0) {
        return '';
    }

    let formatted = '\n\n--- REFERENCE CONTEXT (for structure understanding only) ---\n\n';

    // Reference sources
    if (context.referenceSources.length > 0) {
        formatted += 'Similar datasets found:\n';
        context.referenceSources.forEach((source, idx) => {
            formatted += `${idx + 1}. ${source.datasetName} (${source.sourceType})\n`;
            formatted += `   ${source.relevanceSummary}\n`;
        });
        formatted += '\n';
    }

    // Column patterns
    if (Object.keys(context.columnPatterns).length > 0) {
        formatted += 'Common column patterns:\n';
        Object.entries(context.columnPatterns).slice(0, 5).forEach(([name, pattern]) => {
            formatted += `- ${name}: ${pattern.datatype}`;
            if (pattern.sampleValues && pattern.sampleValues.length > 0) {
                formatted += ` (e.g., ${pattern.sampleValues.slice(0, 2).join(', ')})`;
            }
            formatted += '\n';
        });
        formatted += '\n';
    }

    // Semantic hints
    if (context.semanticHints.length > 0) {
        formatted += 'Recommendations:\n';
        context.semanticHints.forEach(hint => {
            formatted += `- ${hint}\n`;
        });
        formatted += '\n';
    }

    formatted += '--- END REFERENCE CONTEXT ---\n\n';
    formatted += 'CRITICAL INSTRUCTIONS:\n';
    formatted += '- Use the reference context ONLY to understand typical structure and patterns\n';
    formatted += '- DO NOT copy any actual data from the reference sources\n';
    formatted += '- Generate 100% original, synthetic data that follows the user\'s schema\n';
    formatted += '- Ensure all generated values are realistic and domain-appropriate\n';
    formatted += '- Output ONLY a valid JSON array of objects\n\n';

    return formatted;
};

module.exports = {
    buildReferenceContext,
    generateSemanticHints,
    formatContextForPrompt
};
