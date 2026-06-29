# Module-1 - AI & ML Engine

The intelligent core of HireVision that handles skill extraction, candidate clustering, and advanced ranking algorithms for job-to-candidate matching.

## Running the Module

```bash
# Install dependencies
pip install -r src/requirements.txt

# Start the FastAPI server
cd src
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Project Structure

### Source Code (`src/`)

- **controllers/**: Business logic for ML operations
  - `SkillsExtractionController.py`: Extracts and analyzes skills from CVs
  - `CandidateClusteringController.py`: Groups similar candidates using clustering

- **models/**: Machine learning models
  - `SkillsExtractionModel.py`: Skill extraction model
  - `CandidateClusteringModel.py`: Clustering model using FAISS

- **routes/**: API endpoints
  - `skillsRoute.py`: Skill extraction endpoints
  - `base.py`: Health check and base endpoints

- **helpers/**: Utility functions
  - `app_factory.py`: FastAPI app initialization
  - `config.py`: Configuration management
  - `faiss_service.py`: FAISS index management

- **ranking_system/**: Advanced ranking and matching engine
  - `engine.py`: Main ranking engine
  - `matcher.py`: Hybrid skill matching
  - `ranker.py`: Ranking algorithms
  - `models_loader.py`: Embedding model management
  - `skill_scoring.py`: Skill importance scoring
  - `cache_manager.py`: Embedding cache management
  - `utils.py`: Utility functions
  - `CONFIG.py`: Ranking system configuration
  - `data/`: Configuration data
    - `context_map.json`: Context mappings
    - `skill_importance.json`: Skill importance weights

### Data Assets

- **Datasets/**: Training and testing datasets
  - `Clustering_Data_Testing/`: Test data for clustering
  - `CV_Dataset/`: CV samples for extraction training

- **faiss_store/**: Pre-built FAISS indices
  - `cv_embeddings.index`: CV embeddings index
  - `job_embeddings.index`: Job description embeddings index

- **Skills_Dataset/**: Pre-computed skill embeddings
  - `skills_with_embeddings.csv`: Skill vocabulary with vectors

## Key Features

### Skill Extraction
- Extracts technical and soft skills from CV text
- Uses NLP and embedding models for accurate identification
- Returns structured skill data with confidence scores

### Candidate Clustering
- Groups candidates by similar skill profiles
- Uses FAISS for efficient similarity search
- Enables efficient batch processing

### Ranking System
The ranking system includes multiple components:

1. **Embedding Manager**: Loads and manages skill/CV embeddings
2. **Hybrid Skill Matcher**: Combines multiple matching strategies
3. **Context-Aware Ranker**: Ranks candidates based on job context
4. **Fusion Engine**: Combines multiple ranking signals

## API Endpoints

### Skills Extraction
- `POST /api/skills/extract`: Extract skills from CV text

### Candidate Clustering
- `POST /api/candidates/cluster`: Cluster similar candidates

### Health Check
- `GET /health`: Server health status

See [API Documentation](API_Documentation.md) for detailed endpoint specifications.

## Configuration

Key configuration files:
- `src/ranking_system/CONFIG.py`: Ranking system settings
- `.env`: Environment variables (MONGODB_URL, etc.)
- `skill_db_relax_20.json`: Skill database
- `token_dist.json`: Token distribution data

## Dependencies

- FastAPI: Web framework
- Motor: Async MongoDB driver
- LangChain: LLM operations
- PyMuPDF (fitz): PDF processing
- FAISS: Vector similarity search
- NumPy: Numerical operations
- Pydantic: Data validation

## Environment Setup

Create a `.env` file in the `src/` directory:

```env
MONGODB_URL=mongodb://...
MONGODB_DATABASE=hirevision
# Other settings as needed
```

## Performance Optimization

- **Embedding Cache**: Stores pre-computed embeddings to reduce computation
- **FAISS Indices**: Enables fast nearest-neighbor search
- **Async Processing**: Uses async/await for concurrent operations

## Development Notes

- The ranking system is performance-optimized for large-scale candidate matching
- Embeddings are cached to improve response times
- Models are loaded at startup for quick inference

## Support

For issues or detailed API specifications, refer to [API_Documentation.md](API_Documentation.md)
