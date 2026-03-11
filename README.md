# HireVision - AI-Powered Recruitment Platform

A comprehensive recruitment platform that leverages AI and machine learning to match candidates with job opportunities through intelligent skill analysis and ranking.

## Project Structure

```
HireVision/
├── Module-1/          # ML/AI Module - Skill extraction, clustering & ranking
│   ├── src/           # Source code
│   │   ├── controllers/    # Business logic controllers
│   │   ├── models/         # ML models and data models
│   │   ├── routes/         # API route definitions
│   │   ├── helpers/        # Configuration and utility functions
│   │   └── ranking_system/ # Core ranking and matching engine
│   ├── Datasets/           # Training and testing datasets
│   ├── faiss_store/        # FAISS index storage for embeddings
│   └── Skills_Dataset/     # Skill embeddings and data
│
└── Server/            # Backend API Server
    ├── controllers/   # Request handlers
    ├── models/        # Data models and database schemas
    ├── routes/        # API route definitions
    └── helpers/       # Utilities and configurations
```

## Key Features

- **Intelligent Skill Extraction**: Extracts and analyzes skills from CVs using AI
- **Candidate Clustering**: Groups similar candidates based on skill profiles
- **Hybrid Ranking System**: Combines semantic search, skill matching, and contextual ranking
- **Real-time Job Matching**: Matches candidates to job opportunities dynamically
- **Embedding Management**: Efficient vector storage and retrieval using FAISS

## Technology Stack

- **Backend**: FastAPI, Python 3.x
- **Database**: MongoDB
- **ML/AI**: LangChain, PyMuPDF, FAISS
- **Server**: Uvicorn

## Installation & Setup

### Requirements
- Python 3.8+
- MongoDB
- Dependencies in `requirements.txt`

### Getting Started

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   - Copy `.env` template and configure your environment variables
   - Set up MongoDB connection string
   - Configure API keys if needed

3. **Run the server**:
   ```bash
   cd Server
   uvicorn main:app --reload --port 8000
   ```

4. **Run the ML module**:
   ```bash
   cd Module-1/src
   python main.py
   ```

## Module Details

### Module-1: AI & ML Engine
Handles intelligent skill extraction, candidate clustering, and ranking:
- **SkillsExtractionController**: Extracts skills from CVs
- **CandidateClusteringController**: Groups similar candidates
- **RankingSystem**: Advanced job-to-candidate matching

See [Module-1 API Documentation](Module-1/API_Documentation.md) for details.

### Server: REST API
Provides backend services:
- User management
- Job posting management
- CV/Application processing
- Application tracking

## Project Status

- Module-1: Active development
- Server: Core implementation complete
- Module-2, Module-3: Reserved for future enhancements

## License

See LICENSE file in respective modules.

## Support

For issues or questions, refer to the module-specific documentation.