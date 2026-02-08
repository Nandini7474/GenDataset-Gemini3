const Dataset = require('../models/Dataset');
const geminiService = require('../services/geminiService');
const { validationResult } = require('express-validator');
const { parseSampleFile, extractSampleData, getFileExtension } = require('../services/fileService');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * Generate dataset using Gemini API with optional Kaggle reference
 * POST /api/generate
 */
const generateDatasetController = async (req, res, next) => {
    try {
        const { topic, description, columns, rowCount } = req.body;

        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        logger.info(`Received generation request for topic: ${topic}`);

        // 1. Build Reference Context (Kaggle Metadata + Public APIs)
        // This won't fail the request if it errors (graceful degradation)
        let referenceContext = null;
        let formattedContext = null;

        try {
            const { buildReferenceContext, formatContextForPrompt } = require('../services/referenceContextBuilder');

            logger.info('Building reference context...');
            referenceContext = await buildReferenceContext(topic, description);
            formattedContext = formatContextForPrompt(referenceContext);

            if (referenceContext && referenceContext.referenceSources.length > 0) {
                logger.success(`Reference context built with ${referenceContext.referenceSources.length} sources`);
            } else {
                logger.info('No reference sources found, proceeding with Gemini-only generation');
            }
        } catch (refError) {
            logger.warn(`Failed to build reference context: ${refError.message}`);
            // Continue without reference
        }

        // 2. Generate Dataset using Gemini with Reference Context
        const generatedData = await geminiService.generateDataset(
            topic,
            description,
            columns,
            rowCount,
            formattedContext
        );

        // 3. Save to Database
        const dataset = new Dataset({
            topic,
            description,
            columns,
            rowCount,
            generatedData,
            referenceSources: referenceContext ? referenceContext.referenceSources : []
        });

        await dataset.save();
        logger.success(`Dataset saved with ID: ${dataset._id}`);

        // 4. Send Response
        res.status(201).json({
            success: true,
            generatedData: dataset.generatedData,
            createdAt: dataset.createdAt,
            referenceContext: {
                used: referenceContext && referenceContext.referenceSources.length > 0,
                sources: referenceContext ? referenceContext.referenceSources : []
            }
        });

    } catch (error) {
        logger.error(`Error in generateDataset: ${error.message}`);
        next(new APIError(error.message, 500));
    }
};

/**
 * Upload sample data file
 * POST /api/uploadSample
 */
const uploadSampleController = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new APIError('No file uploaded', 400);
        }

        const { filename, path: filePath, mimetype, size } = req.file;
        const fileExt = getFileExtension(filename);

        logger.info(`File uploaded: ${filename}`);

        // Parse the uploaded file
        const parsedData = await parseSampleFile(filePath, fileExt);
        const sampleData = extractSampleData(parsedData, 10);

        // Return file info and sample data
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename,
                filePath,
                fileType: fileExt,
                size,
                totalRows: parsedData.length,
                sampleData
            }
        });

    } catch (error) {
        logger.error(`Error in uploadSample: ${error.message}`);
        next(new APIError(error.message, 500));
    }
};

/**
 * Get all datasets with pagination
 * GET /api/datasets
 */
const getDatasetsController = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        // Get total count
        const total = await Dataset.countDocuments();

        // Get datasets (exclude large generatedData field)
        const datasets = await Dataset.find()
            .select('-generatedData')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        logger.info(`Retrieved ${datasets.length} datasets (page ${page})`);

        res.status(200).json({
            success: true,
            data: {
                datasets,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error(`Error in getDatasets: ${error.message}`);
        next(new APIError(error.message, 500));
    }
};

/**
 * Get single dataset by ID with full data
 * GET /api/datasets/:id
 */
const getDatasetByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;

        const dataset = await Dataset.findById(id);

        if (!dataset) {
            throw new APIError('Dataset not found', 404);
        }

        logger.info(`Retrieved dataset: ${id}`);

        res.status(200).json({
            success: true,
            data: dataset
        });

    } catch (error) {
        logger.error(`Error in getDatasetById: ${error.message}`);
        next(new APIError(error.message, error.statusCode || 500));
    }
};

/**
 * Delete dataset by ID
 * DELETE /api/datasets/:id
 */
const deleteDatasetController = async (req, res, next) => {
    try {
        const { id } = req.params;

        const dataset = await Dataset.findByIdAndDelete(id);

        if (!dataset) {
            throw new APIError('Dataset not found', 404);
        }

        logger.info(`Deleted dataset: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Dataset deleted successfully'
        });

    } catch (error) {
        logger.error(`Error in deleteDataset: ${error.message}`);
        next(new APIError(error.message, error.statusCode || 500));
    }
};

module.exports = {
    generateDatasetController,
    uploadSampleController,
    getDatasetsController,
    getDatasetByIdController,
    deleteDatasetController
};
