import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def load_data(filename: str):
    data_path = BASE_DIR / "data" / filename
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    print(f"⚠️ Warning: {filename} not found!")
    return {}


CONFIG = {
    "embed_model": os.getenv("EMBED_MODEL", "mixedbread-ai/mxbai-embed-large-v1"),
    "cross_encoder_model": os.getenv("CE_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2"),
    
    "chunk_size_tokens": 100,
    "chunk_overlap_tokens": 20,
    "top_k_retriever": 40,
    "top_k_rerank": 15,
    
    # "cache_dir": "./embedding_cache",
    "cache_dir": os.getenv("CACHE_DIR", str(BASE_DIR / "embedding_cache")),
    
    "semantic_threshold": 0.6,
    "fuzzy_threshold": 60,
    "max_cv_chunks": 100,
    "min_chunk_length": 10,

    # ✅ CORRECTED: Better weights emphasizing skills (job requirements)
    "fusion_weights": {
        "dense": 0.35,    # Semantic similarity (CV-Job embedding match)
        "sparse": 0.25,   # Keyword matching (exact/fuzzy skill matches)
        "skill": 0.40     # Skill overlap weighting (most important!)
    },

    "skill_signal_weights": {
        "exact": 0.45,     # Exact match is most reliable
        "fuzzy": 0.20,     # Fuzzy match helps find variations
        "semantic": 0.25,  # Semantic similarity for synonyms
        "context": 0.10    # Context for domain-specific terms
    },

    # ✅ CORRECTED: Give more weight to skills for ranking
    "final_weights": {
        "skill": 0.45,        # Skills are most important
        "rerank": 0.35,       # Semantic relevance matters
        "retrieval": 0.20     # Initial retrieval less critical
    },


    "skill_importance":  load_data("skill_importance.json"),
    "context_map" : load_data("context_map.json"),

    # safety settings
    "max_cvs_rank": 200,
}

