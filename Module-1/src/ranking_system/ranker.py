from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from ranking_system.CONFIG import CONFIG
# FAISS
import faiss
# BM25 for sparse retrieval
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
# ============================================================================
# DUAL RETRIEVER (FAISS + BM25) —
# ============================================================================
class DualRetriever:
    def __init__(self, dim: int, job_texts: List[str], job_embeddings: np.ndarray, jobs: List[Dict]):
        self.index = faiss.IndexFlatIP(dim)
        job_embs_copy = job_embeddings.copy()
        faiss.normalize_L2(job_embs_copy)
        self.index.add(job_embs_copy)
        self.jobs = jobs
        tokenized = [t.lower().split() for t in job_texts]
        self.bm25 = BM25Okapi(tokenized)
        print(f"✅ Dual retriever initialized for {len(jobs)} jobs (Dense + Sparse)")

    def retrieve(self, cv_emb: np.ndarray, cv_text: str, k: int = 30):
        k = min(k, len(self.jobs))

        # Dense retrieval (FAISS)
        q = cv_emb.reshape(1, -1).copy()
        faiss.normalize_L2(q)
        D, I = self.index.search(q, k)

        # Sparse retrieval (BM25)
        tokens = cv_text.lower().split()
        bm25_scores = self.bm25.get_scores(tokens)

        # FIX: Normalize BM25 scores to 0-1 range
        bm25_max = np.max(bm25_scores) if len(bm25_scores) > 0 else 1.0
        bm25_min = np.min(bm25_scores) if len(bm25_scores) > 0 else 0.0
        bm25_range = bm25_max - bm25_min

        results = []
        for idx, d_score in zip(I[0], D[0]):
            s_score = float(bm25_scores[idx])
            # Normalize BM25 to 0-1
            if bm25_range > 0:
                s_score_norm = (s_score - bm25_min) / bm25_range
            else:
                s_score_norm = 0.5

            results.append((self.jobs[idx], float(d_score), s_score_norm))

        return results

# ============================================================================
# FUSION ENGINE — Normalized
# ============================================================================
class FusionEngine:
    def __init__(self):
        self.w = CONFIG["fusion_weights"]

    def fuse(self, dense: float, sparse: float, skill: float) -> float:
        """Fuse dense, sparse, and skill signals (all 0-1 range)"""
        dense_n = min(max(dense, 0.0), 1.0)
        sparse_n = min(max(sparse, 0.0), 1.0)
        skill_n = min(max(skill, 0.0), 1.0)

        # Weighted sum
        fused = (
            self.w["dense"] * dense_n +
            self.w["sparse"] * sparse_n +
            self.w["skill"] * skill_n
        )

        return min(fused, 1.0)


# ============================================================================
# SKILL-ONLY RERANKER — Normalized
# ============================================================================
class ContextAwareReranker:
    def __init__(self, model_name: str = None):
        print("🤖 Loading reranker...")
        self.model = CrossEncoder(model_name or CONFIG["cross_encoder_model"])

        # FIX: Updated weights prioritizing skills
        self.weights = CONFIG["final_weights"]

        print("✅ Reranker loaded")

    def rerank(self, cv_text: str, cv_meta: Dict, candidates: List[Dict],
               skill_results: Dict, k: int = 10):

        # Get cross-encoder scores
        pairs = [[cv_text, c["retrieval_data"]["text"]] for c in candidates]
        ce_scores_raw = self.model.predict(pairs, batch_size=16)

        # FIX: Proper normalization for CrossEncoder scores
        # CrossEncoder returns scores typically in range [-10, +10]
        # We need to normalize to [0, 1]
        ce_scores_raw = np.array(ce_scores_raw)

        # Method 1: Min-Max normalization (recommended)
        ce_min = ce_scores_raw.min()
        ce_max = ce_scores_raw.max()
        if ce_max - ce_min > 0:
            ce_scores = (ce_scores_raw - ce_min) / (ce_max - ce_min)
        else:
            ce_scores = np.ones_like(ce_scores_raw) * 0.5

        # Clip to [0, 1]
        ce_scores = np.clip(ce_scores, 0.0, 1.0)

        reranked = []

        for i, candidate in enumerate(candidates):
            job = candidate["retrieval_data"]

            # All components in 0-1 range
            retrieval_score = min(max(candidate["fusion_score"], 0.0), 1.0)
            ce_score = float(ce_scores[i])
            skill_match = min(max(skill_results[job["title"]]["weighted_score"], 0.0), 1.0)

            # FIX: Use updated weights
            final = (
                self.weights["retrieval"] * retrieval_score +
                self.weights["rerank"] * ce_score +
                self.weights["skill"] * skill_match
            )

            final = min(final, 1.0)

            reranked.append((job, {
                "final_score": final * 100,
                "retrieval_score": retrieval_score * 100,
                "ce_score": ce_score * 100,
                "skill_match": skill_match * 100,
                # Add detailed breakdown for debugging
                "breakdown": {
                    "retrieval_contrib": self.weights["retrieval"] * retrieval_score * 100,
                    "rerank_contrib": self.weights["rerank"] * ce_score * 100,
                    "skill_contrib": self.weights["skill"] * skill_match * 100
                }
            }))

        reranked.sort(key=lambda x: x[1]["final_score"], reverse=True)
        return reranked[:k]