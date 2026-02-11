# NS-DataLab
# GenDataset-Gemini3Pro

GenDataset-Gemini3Pro is an AI-powered dataset generation system that automates the creation of high-quality, realistic, and reusable datasets for machine learning workflows.

## Problem
Creating reliable ML datasets is time-consuming and often limited by data availability, inconsistent quality, and poor reusability.

## Solution
GenDataset-Gemini3Pro uses **Gemini 3 Pro** as its core intelligence layer to generate structured datasets based on user-defined requirements such as domain, schema, data types, size, and contextual constraints.

## How It Works
- Users configure dataset requirements via the UI
- Gemini 3 Pro generates schema-consistent, high-quality data
- Kaggle datasets are used as references to ground realism
- Generated datasets are stored in MongoDB for versioning and reuse
- Datasets can be downloaded in standard formats (CSV / JSON)

## Key Features
- AI-driven dataset generation using Gemini 3 Pro  
- Custom schema and constraint support  
- Real-world data grounding via Kaggle API  
- Dataset versioning and reuse with MongoDB  
- Ready-to-use datasets for ML pipelines  

##  Live Deployment
### 🔹 Frontend (Vercel)
https://YOUR-VERCEL-URL.vercel.app
### 🔹 Backend (Render)
https://gendataset-gemini3.onrender.com
---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- Axios

**Backend**
- Node.js
- Express
- MongoDB Atlas
- Google Gemini API

## Why Gemini 3 Pro
Gemini 3 Pro enables deep reasoning, instruction-following, and structured data generation, making it ideal for controlled, realistic dataset creation rather than simple synthetic sampling.

## Impact
- Saves hours of manual dataset creation  
- Improves data realism and consistency  
- Accelerates ML experimentation and prototyping  

## Hackathon Submission
Built for the **Gemini 3 Hackathon**.
