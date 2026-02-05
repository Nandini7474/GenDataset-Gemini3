# NSDataLab Backend

Scalable backend API for AI-powered dataset generation using Node.js, Express.js, MongoDB, and Gemini API.

## 🚀 Features

- **AI Dataset Generation** - Generate realistic datasets using Google's Gemini API
- **File Upload Support** - Upload CSV/JSON sample files for context
- **Dataset History** - Store and retrieve previously generated datasets
- **RESTful API** - Clean, well-documented API endpoints
- **MVC Architecture** - Organized, maintainable code structure
- **Validation & Security** - Input validation, rate limiting, and security headers
- **Error Handling** - Centralized error handling with detailed logging

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nsdatalab
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Start the server:**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Generate Dataset
**POST** `/generate`

Generate a dataset using AI based on specifications.

**Request Body:**
```json
{
  "topic": "E-commerce Sales Data",
  "description": "Monthly sales data for an online store",
  "columns": [
    { "name": "product_name", "datatype": "string" },
    { "name": "price", "datatype": "currency" },
    { "name": "quantity", "datatype": "integer" },
    { "name": "sale_date", "datatype": "date" }
  ],
  "rowCount": 50,
  "sampleFileUrl": "/path/to/sample.csv" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset generated successfully",
  "data": {
    "id": "...",
    "topic": "...",
    "generatedData": [...],
    "createdAt": "..."
  }
}
```

#### 2. Upload Sample File
**POST** `/uploadSample`

Upload a CSV or JSON file as sample data.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepted formats: `.csv`, `.json`
- Max size: 10MB

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "sample.csv",
    "filePath": "/uploads/sample-123456.csv",
    "fileType": "csv",
    "totalRows": 100,
    "sampleData": [...]
  }
}
```

#### 3. Get All Datasets
**GET** `/datasets`

Retrieve dataset history with pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10, max: 100)
- `sortBy` (optional, default: createdAt)
- `sortOrder` (optional, asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### 4. Get Dataset by ID
**GET** `/datasets/:id`

Retrieve a single dataset with full data.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "topic": "...",
    "generatedData": [...],
    ...
  }
}
```

#### 5. Delete Dataset
**DELETE** `/datasets/:id`

Delete a dataset by ID.

**Response:**
```json
{
  "success": true,
  "message": "Dataset deleted successfully"
}
```

#### 6. Health Check
**GET** `/health`

Check server status.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── gemini.js     # Gemini API setup
├── controllers/      # Request handlers
│   └── datasetController.js
├── middleware/       # Custom middleware
│   ├── errorHandler.js
│   ├── upload.js
│   └── validation.js
├── models/           # Database schemas
│   └── Dataset.js
├── routes/           # API routes
│   └── datasetRoutes.js
├── services/         # Business logic
│   ├── geminiService.js
│   └── fileService.js
├── utils/            # Utility functions
│   ├── logger.js
│   └── validators.js
├── uploads/          # Uploaded files
├── .env.example      # Environment template
├── .gitignore
├── package.json
└── server.js         # Entry point
```

## 🔒 Security Features

- **Helmet** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS** - Configurable cross-origin requests
- **Input Validation** - Request validation and sanitization
- **File Upload Limits** - 10MB max file size

## 🎯 Supported Data Types

- `string` - Text values
- `number` / `integer` / `float` - Numeric values
- `boolean` - true/false
- `date` - ISO 8601 format
- `email` - Valid email addresses
- `phone` - Phone numbers with country code
- `url` - Valid URLs
- `address` - Street addresses
- `name` - Full names
- `percentage` - 0-100 values
- `currency` - Monetary values

## 🐛 Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "errors": [...]  // Optional validation errors
}
```

## 📝 Logging

The server uses colored console logging with timestamps:
- `[INFO]` - General information
- `[SUCCESS]` - Successful operations
- `[WARN]` - Warnings
- `[ERROR]` - Errors
- `[DEBUG]` - Debug info (development only)

## 🧪 Testing

Test endpoints using tools like:
- **Postman** - Import the API collection
- **cURL** - Command-line testing
- **Thunder Client** - VS Code extension

Example cURL request:
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "User Data",
    "description": "Sample user information",
    "columns": [
      {"name": "name", "datatype": "name"},
      {"name": "email", "datatype": "email"}
    ],
    "rowCount": 10
  }'
```

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for database
3. Configure proper CORS origins
4. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name nsdatalab-backend
   ```

## 📄 License

ISC

## 👥 Support

For issues or questions, please create an issue in the repository.
