const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generate a new dataset
 * @param {Object} data - { topic, description, columns, rowCount }
 */
export const generateDataset = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.errors?.[0]?.msg || 'Failed to generate dataset');
        }

        return result;
    } catch (error) {
        console.error('API Error (generateDataset):', error);
        throw error;
    }
};

/**
 * Upload a sample file
 * @param {File} file 
 */
export const uploadSample = async (file) => {
    try {
        const formData = new FormData();
        formData.append('sampleFile', file);

        const response = await fetch(`${API_BASE_URL}/uploadSample`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to upload sample');
        }

        return result;
    } catch (error) {
        console.error('API Error (uploadSample):', error);
        throw error;
    }
};

/**
 * Get all datasets
 * @param {number} page 
 * @param {number} limit 
 */
export const getDatasets = async (page = 1, limit = 10) => {
    try {
        const response = await fetch(`${API_BASE_URL}/datasets?page=${page}&limit=${limit}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch datasets');
        }

        return result;
    } catch (error) {
        console.error('API Error (getDatasets):', error);
        throw error;
    }
};

/**
 * Get dataset by ID
 * @param {string} id 
 */
export const getDatasetById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/datasets/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch dataset');
        }

        return result;
    } catch (error) {
        console.error('API Error (getDatasetById):', error);
        throw error;
    }
};
