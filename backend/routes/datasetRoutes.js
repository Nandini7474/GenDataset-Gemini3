const express = require('express');
const router = express.Router();
const {
    generateDatasetController,
    uploadSampleController,
    getDatasetsController,
    getDatasetByIdController,
    deleteDatasetController
} = require('../controllers/datasetController');
const { validateGenerateDataset, validatePagination, sanitizeInput } = require('../middleware/validation');
const { handleUpload } = require('../middleware/upload');

/**
 * @route   POST /api/generate
 * @desc    Generate dataset using Gemini API
 * @access  Public
 */
router.post('/generate', sanitizeInput, validateGenerateDataset, generateDatasetController);

/**
 * @route   POST /api/uploadSample
 * @desc    Upload sample CSV/JSON file
 * @access  Public
 */
router.post('/uploadSample', handleUpload, uploadSampleController);

/**
 * @route   GET /api/datasets
 * @desc    Get all datasets with pagination
 * @access  Public
 */
router.get('/datasets', validatePagination, getDatasetsController);

/**
 * @route   GET /api/datasets/:id
 * @desc    Get single dataset by ID
 * @access  Public
 */
router.get('/datasets/:id', getDatasetByIdController);

/**
 * @route   DELETE /api/datasets/:id
 * @desc    Delete dataset by ID
 * @access  Public
 */
router.delete('/datasets/:id', deleteDatasetController);

module.exports = router;
