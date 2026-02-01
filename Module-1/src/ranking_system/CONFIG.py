import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def load_data(filename: str):
    # مسار ملف الـ JSON جوه فولدر data
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

    # FIX: Remove context from fusion (not used)
    "fusion_weights": {
        "dense": 0.50,    # Semantic similarity
        "sparse": 0.25,   # Keyword matching
        "skill": 0.25     # Skill overlap
    },

    "skill_signal_weights": {
        "exact": 0.35,
        "fuzzy": 0.25,
        "semantic": 0.30,
        "context": 0.10
    },

    # FIX: Give more weight to skills (they're most important!)
    "final_weights": {
        "skill": 0.30,        # Most important
        "rerank": 0.45,       # Semantic relevance
        "retrieval": 0.25     # Initial retrieval
    },


    "skill_importance":  load_data("skill_importance.json"),
    "context_map" : load_data("context_map.json"),
}

if not os.path.exists(CONFIG["cache_dir"]):
    os.makedirs(CONFIG["cache_dir"], exist_ok=True)