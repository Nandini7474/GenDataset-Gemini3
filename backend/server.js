require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { initializeGemini } = require('./config/gemini');
const { initializeKaggle, validateKaggleConfig } = require('./config/kaggle');
const datasetRoutes = require('./routes/datasetRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize Gemini API
try {
    initializeGemini();
} catch (error) {
    logger.error('Failed to initialize Gemini API. Please check your API key.');
}

// Initialize Kaggle CLI (optional, graceful degradation)
(async () => {
    try {
        const validation = await validateKaggleConfig();

        if (validation.isConfigured) {
            const initialized = await initializeKaggle();
            if (initialized && validation.isCliAvailable) {
                logger.success('Kaggle CLI initialized successfully');
            } else if (!validation.isCliAvailable) {
                logger.warn('Kaggle credentials configured but CLI not installed');
                logger.info('Install Kaggle CLI: pip install kaggle');
            }
        } else {
            logger.info('Kaggle integration disabled (no credentials configured)');
        }
    } catch (error) {
        logger.warn(`Kaggle initialization failed: ${error.message}`);
        logger.info('Dataset generation will work without Kaggle references');
    }
})();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: ['https://gen-dataset-gemini3.vercel.app', 'http://localhost:5173'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', datasetRoutes);

app.get('/', (req, res) => {
    res.send('Backend is alive 🚀');
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.success(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    process.exit(1);
});


module.exports = app;
