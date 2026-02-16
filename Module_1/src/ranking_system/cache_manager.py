import os
import time
import json
import time
import pickle
import hashlib
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from .CONFIG import CONFIG

# -----------------------------
# 3) Embedding Cache Manager
# -----------------------------
# class EmbeddingCache:
#     """Manages caching of embeddings to avoid recomputation"""

#     def __init__(self, cache_dir: str = CONFIG["cache_dir"]):
#         self.cache_dir = cache_dir
#         os.makedirs(cache_dir, exist_ok=True)
#         self.cache_file = os.path.join(cache_dir, "embedding_cache.pkl")
#         self.cache = self._load_cache()

#     def _load_cache(self) -> Dict[str, Any]:
#         if os.path.exists(self.cache_file):
#             try:
#                 with open(self.cache_file, 'rb') as f:
#                     return pickle.load(f)
#             except:
#                 return {}
#         return {}

#     def _save_cache(self):
#         with open(self.cache_file, 'wb') as f:
#             pickle.dump(self.cache, f)

#     def get_cv_key(self, cv_path: str, model_name: str) -> str:
#         cv_stat = os.stat(cv_path)
#         content = f"{model_name}:{cv_path}:{cv_stat.st_mtime}:{cv_stat.st_size}"
#         return hashlib.md5(content.encode('utf-8')).hexdigest()

#     def get_jobs_key(self, jobs: List[Dict], model_name: str) -> str:
#         jobs_str = ""
#         for job in jobs:
#             jobs_str += f"{job['title']}:{job['text']}"
#         content = f"{model_name}:{jobs_str}"
#         return hashlib.md5(content.encode('utf-8')).hexdigest()

#     def save_cv_embedding(self, cv_key: str, cv_text: str, embedding: np.ndarray):
#         self.cache[f"cv_{cv_key}"] = {
#             'text': cv_text,
#             'embedding': embedding,
#             'timestamp': time.time()
#         }
#         self._save_cache()

#     def save_jobs_embeddings(self, jobs_key: str, job_texts: List[str], embeddings: np.ndarray):
#         self.cache[f"jobs_{jobs_key}"] = {
#             'job_texts': job_texts,
#             'embeddings': embeddings,
#             'timestamp': time.time()
#         }
#         self._save_cache()

#     def get_cv_embedding(self, cv_key: str) -> Optional[Tuple[str, np.ndarray]]:
#         cache_key = f"cv_{cv_key}"
#         if cache_key in self.cache:
#             data = self.cache[cache_key]
#             return data['text'], data['embedding']
#         return None

#     def get_jobs_embeddings(self, jobs_key: str) -> Optional[Tuple[List[str], np.ndarray]]:
#         cache_key = f"jobs_{jobs_key}"
#         if cache_key in self.cache:
#             data = self.cache[cache_key]
#             return data['job_texts'], data['embeddings']
#         return None

#     def clear_cache(self):
#         self.cache = {}
#         self._save_cache()
#         print("Cache cleared")

#     def get_cache_stats(self) -> Dict[str, Any]:
#         cv_keys = [k for k in self.cache.keys() if k.startswith('cv_')]
#         jobs_keys = [k for k in self.cache.keys() if k.startswith('jobs_')]

#         return {
#             'total_entries': len(self.cache),
#             'cv_entries': len(cv_keys),
#             'jobs_entries': len(jobs_keys),
#             'cache_size_mb': os.path.getsize(self.cache_file) / (1024 * 1024) if os.path.exists(self.cache_file) else 0
#         }

class EmbeddingCache:
    def __init__(self, cache_dir: str = CONFIG["cache_dir"]):
        self.cache_dir = cache_dir
        # مجلد منفصل للـ Metadata وآخر للـ Embeddings
        self.meta_dir = os.path.join(cache_dir, "metadata")
        self.vector_dir = os.path.join(cache_dir, "vectors")
        
        os.makedirs(self.meta_dir, exist_ok=True)
        os.makedirs(self.vector_dir, exist_ok=True)

    def _get_key(self, *args) -> str:
        """MD5 Hash لأي عدد من النصوص المدخلة لضمان فرادة الكي"""
        # بنجمع كل الـ arguments اللي مبعوثة في نص واحد
        content = ":".join([str(arg) for arg in args])
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def save_cv_embedding(self, cv_path: str, cv_text: str, embedding: np.ndarray):
        # الكي هنا يعتمد على المحتوى مش المسار (أضمن)
        cv_key = self._get_key(cv_text)
        
        # 1. حفظ الـ Metadata كـ JSON
        meta = {
            "path": cv_path,
            "timestamp": time.time(),
            "text_preview": cv_text[:100] # للاستطلاع فقط
        }
        with open(os.path.join(self.meta_dir, f"cv_{cv_key}.json"), 'w') as f:
            json.dump(meta, f)

        # 2. حفظ المصفوفة كـ .npy (سريع وآمن)
        np.save(os.path.join(self.vector_dir, f"cv_{cv_key}.npy"), embedding)

    def get_cv_embedding(self, cv_key: str) -> Optional[np.ndarray]:
        # cv_key هنا هو اللي طالع من _get_key
        vector_path = os.path.join(self.vector_dir, f"cv_{cv_key}.npy")
        if os.path.exists(vector_path):
            return np.load(vector_path)
        return None

    def save_jobs_embeddings(self, jobs: List[Dict], embeddings: np.ndarray):
        # دمج العناوين والنصوص لعمل Key فريد
        jobs_str = "".join([f"{j['title']}{j.get('text','')}" for j in jobs])
        jobs_key = self._get_key(jobs_str)
        
        np.save(os.path.join(self.vector_dir, f"jobs_{jobs_key}.npy"), embeddings)
        
        # حفظ الميتا داتا لمعرفة الوظائف المربوطة بهذا الكاش
        with open(os.path.join(self.meta_dir, f"jobs_{jobs_key}.json"), 'w') as f:
            json.dump({"count": len(jobs), "timestamp": time.time()}, f)

    def get_jobs_embeddings(self, jobs: List[Dict]) -> Optional[np.ndarray]:
        jobs_str = "".join([f"{j['title']}{j.get('text','')}" for j in jobs])
        jobs_key = self._get_key(jobs_str)
        vector_path = os.path.join(self.vector_dir, f"jobs_{jobs_key}.npy")
        
        if os.path.exists(vector_path):
            return np.load(vector_path)
        return None