const Dataset = require('../models/Dataset');
const { generateDataset } = require('../services/geminiService');
const { getKaggleReference } = require('../services/kaggleService');
const { parseSampleFile, extractSampleData, getFileExtension } = require('../services/fileService');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * Generate dataset using Gemini API with optional Kaggle reference
 * POST /api/generate
 */
const generateDatasetController = async (req, res, next) => {
    try {
        const { topic, description, columns, rowCount, sampleFileUrl } = req.body;

        logger.info(`Generating dataset: ${topic}`);

        // Parse sample file if provided
        let sampleData = null;
        if (sampleFileUrl) {
            try {
                const fileExt = getFileExtension(sampleFileUrl);
                const parsedFile = await parseSampleFile(sampleFileUrl, fileExt);
                sampleData = extractSampleData(parsedFile, 5);
            } catch (error) {
                logger.warn(`Could not parse sample file: ${error.message}`);
                // Continue without sample data
            }
        }

        // Get Kaggle reference (gracefully handle failures)
        let kaggleReference = null;
        try {
            logger.info('Attempting to fetch Kaggle reference...');
            kaggleReference = await getKaggleReference(topic, description);

            if (kaggleReference) {
                logger.success(`Using Kaggle reference: ${kaggleReference.datasetName}`);
            } else {
                logger.info('No Kaggle reference found, proceeding with Gemini-only generation');
            }
        } catch (error) {
            logger.warn(`Kaggle reference retrieval failed: ${error.message}`);
            logger.info('Falling back to Gemini-only generation');
            // Continue without Kaggle reference
        }

        // Generate dataset using Gemini (with or without Kaggle reference)
        const generatedData = await generateDataset({
            topic,
            description,
            columns,
            rowCount,
            sampleData,
            kaggleReference
        });

        // Prepare Kaggle reference metadata for database
        const kaggleReferences = kaggleReference ? [{
            datasetName: kaggleReference.datasetName,
            datasetUrl: kaggleReference.datasetUrl,
            datasetRef: kaggleReference.datasetRef,
            columnsUsed: kaggleReference.columns.map(col => col.name),
            sampleSize: kaggleReference.sampleSize,
            usedAt: new Date()
        }] : [];

        // Save to database
        const dataset = new Dataset({
            topic,
            description,
            columns,
            rowCount,
            sampleFileUrl: sampleFileUrl || null,
            kaggleReferences,
            generatedData
        });

        await dataset.save();

        logger.success(`Dataset saved with ID: ${dataset._id}`);

        // Return response with Kaggle reference info
        res.status(201).json({
            success: true,
            message: 'Dataset generated successfully',
            data: {
                id: dataset._id,
                topic: dataset.topic,
                description: dataset.description,
                columns: dataset.columns,
                rowCount: dataset.rowCount,
                generatedData: dataset.generatedData,
                createdAt: dataset.createdAt,
                kaggleReference: kaggleReference ? {
                    used: true,
                    datasetName: kaggleReference.datasetName,
                    datasetUrl: kaggleReference.datasetUrl,
                    columnsUsed: kaggleReference.columns.map(col => col.name)
                } : {
                    used: false
                }
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
