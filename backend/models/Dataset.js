const mongoose = require('mongoose');

/**
 * Column Schema - Defines structure for dataset columns
 */
const columnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Column name is required'],
        trim: true
    },
    datatype: {
        type: String,
        required: [true, 'Column datatype is required'],
        enum: ['string', 'number', 'boolean', 'date', 'email', 'phone', 'url', 'address', 'name', 'integer', 'float', 'percentage', 'currency'],
        lowercase: true
    }
}, { _id: false });

/**
 * Dataset Schema - Main schema for storing generated datasets
 */
const datasetSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
        maxlength: [200, 'Topic cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    columns: {
        type: [columnSchema],
        required: [true, 'At least one column is required'],
        validate: {
            validator: function (columns) {
                return columns && columns.length > 0 && columns.length <= 50;
            },
            message: 'Dataset must have between 1 and 50 columns'
        }
    },
    rowCount: {
        type: Number,
        required: [true, 'Row count is required'],
        min: [1, 'Row count must be at least 1'],
        max: [1000, 'Row count cannot exceed 1000']
    },
    sampleFileUrl: {
        type: String,
        default: null,
        trim: true
    },
    referenceSources: [{
        sourceType: {
            type: String,
            enum: ['kaggle', 'huggingface', 'openml', 'custom'],
            required: true
        },
        datasetName: {
            type: String,
            trim: true
        },
        datasetUrl: {
            type: String,
            trim: true
        },
        relevanceSummary: {
            type: String,
            trim: true
        },
        relevanceScore: {
            type: Number
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    }],
    generatedData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient querying and pagination
datasetSchema.index({ createdAt: -1 });
datasetSchema.index({ topic: 'text', description: 'text' });

// Virtual for dataset size
datasetSchema.virtual('datasetSize').get(function () {
    return Array.isArray(this.generatedData) ? this.generatedData.length : 0;
});

// Method to get dataset metadata without full data
datasetSchema.methods.getMetadata = function () {
    return {
        _id: this._id,
        topic: this.topic,
        description: this.description,
        columns: this.columns,
        rowCount: this.rowCount,
        sampleFileUrl: this.sampleFileUrl,
        datasetSize: this.datasetSize,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

const Dataset = mongoose.model('Dataset', datasetSchema);

module.exports = Dataset;
