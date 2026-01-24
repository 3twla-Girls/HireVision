import time
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from cache_manager import EmbeddingCache
from utils import time_function
# Embeddings & reranker
from sentence_transformers import SentenceTransformer, CrossEncoder
from CONFIG import CONFIG
# -----------------------------
# 4) Embedding Manager with Caching
# -----------------------------
class EmbeddingManager:
    def __init__(self, model_name=None, cache_dir: str = CONFIG["cache_dir"]):
        self.model_name = model_name or CONFIG["embed_model"]
        self.cache = EmbeddingCache(cache_dir)
        print(f"🤖 Loading embedding model: {self.model_name}")
        start_time = time.time()
        self.model = SentenceTransformer(self.model_name)
        self.dim = self.model.get_sentence_embedding_dimension()
        load_time = time.time() - start_time
        print(f"  ⏱️  Embedding model load: {load_time:.3f} seconds")
        print(f"  📏 Model dimension: {self.dim}")

    @time_function
    def embed_texts(self, texts: List[str], cache_key: str = None) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)

        if cache_key:
            cached = self.cache.get_jobs_embeddings(cache_key)
            if cached:
                print(f"  💾 Using cached embeddings for {len(texts)} texts")
                return cached[1]

        embs = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        if cache_key:
            self.cache.save_jobs_embeddings(cache_key, texts, embs)
            print(f"  💾 Cached embeddings for {len(texts)} texts")

        return np.asarray(embs, dtype=np.float32)

    @time_function
    def embed_cv(self, cv_path: str, cv_text: str) -> Tuple[str, np.ndarray]:
        cv_key = self.cache.get_cv_key(cv_path, self.model_name)

        cached = self.cache.get_cv_embedding(cv_key)
        if cached:
            print(f"  💾 Using cached CV embedding")
            return cached[0], cached[1]

        embedding = self.model.encode(
            [cv_text.lower()],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False
        )[0]

        self.cache.save_cv_embedding(cv_key, cv_text, embedding)
        print(f"  💾 Cached CV embedding")

        return cv_text.lower(), embedding
