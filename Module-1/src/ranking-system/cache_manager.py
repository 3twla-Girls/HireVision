import os
import time
import pickle
import hashlib
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from CONFIG import CONFIG

# -----------------------------
# 3) Embedding Cache Manager
# -----------------------------
class EmbeddingCache:
    """Manages caching of embeddings to avoid recomputation"""

    def __init__(self, cache_dir: str = CONFIG["cache_dir"]):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        self.cache_file = os.path.join(cache_dir, "embedding_cache.pkl")
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'rb') as f:
                    return pickle.load(f)
            except:
                return {}
        return {}

    def _save_cache(self):
        with open(self.cache_file, 'wb') as f:
            pickle.dump(self.cache, f)

    def get_cv_key(self, cv_path: str, model_name: str) -> str:
        cv_stat = os.stat(cv_path)
        content = f"{model_name}:{cv_path}:{cv_stat.st_mtime}:{cv_stat.st_size}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def get_jobs_key(self, jobs: List[Dict], model_name: str) -> str:
        jobs_str = ""
        for job in jobs:
            jobs_str += f"{job['title']}:{job['text']}"
        content = f"{model_name}:{jobs_str}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def save_cv_embedding(self, cv_key: str, cv_text: str, embedding: np.ndarray):
        self.cache[f"cv_{cv_key}"] = {
            'text': cv_text,
            'embedding': embedding,
            'timestamp': time.time()
        }
        self._save_cache()

    def save_jobs_embeddings(self, jobs_key: str, job_texts: List[str], embeddings: np.ndarray):
        self.cache[f"jobs_{jobs_key}"] = {
            'job_texts': job_texts,
            'embeddings': embeddings,
            'timestamp': time.time()
        }
        self._save_cache()

    def get_cv_embedding(self, cv_key: str) -> Optional[Tuple[str, np.ndarray]]:
        cache_key = f"cv_{cv_key}"
        if cache_key in self.cache:
            data = self.cache[cache_key]
            return data['text'], data['embedding']
        return None

    def get_jobs_embeddings(self, jobs_key: str) -> Optional[Tuple[List[str], np.ndarray]]:
        cache_key = f"jobs_{jobs_key}"
        if cache_key in self.cache:
            data = self.cache[cache_key]
            return data['job_texts'], data['embeddings']
        return None

    def clear_cache(self):
        self.cache = {}
        self._save_cache()
        print("Cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        cv_keys = [k for k in self.cache.keys() if k.startswith('cv_')]
        jobs_keys = [k for k in self.cache.keys() if k.startswith('jobs_')]

        return {
            'total_entries': len(self.cache),
            'cv_entries': len(cv_keys),
            'jobs_entries': len(jobs_keys),
            'cache_size_mb': os.path.getsize(self.cache_file) / (1024 * 1024) if os.path.exists(self.cache_file) else 0
        }