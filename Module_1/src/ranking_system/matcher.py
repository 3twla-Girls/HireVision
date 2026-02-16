import re
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from .CONFIG import CONFIG
from .models_loader import EmbeddingManager
from .utils import time_function
from cachetools import LRUCache
# FAISS
import faiss
# Fuzzy
from rapidfuzz import fuzz
# ================================================
# ULTRA-OPTIMIZED HYBRID SKILL MATCHER
# ================================================
class HybridSkillMatcher:
    """
    Full-featured skill matcher combining:
    - 4 signals: exact, fuzzy, semantic, context
    - Weighted fusion
    - Batch processing for speed
    - Caching for CV chunks and skill embeddings
    - Matched text tracking for explainability
    - Agent statistics
    """

    def __init__(self, embedder: EmbeddingManager, config: dict = CONFIG):
        self.embedder = embedder
        self.config = config

        # Multi-level caches
        self.skill_embedding_cache = {}
        self.cv_cache = LRUCache(maxsize=100)
        self.fuzzy_cache = LRUCache(maxsize=5000)
        # self.cv_cache = {}
        # self.fuzzy_cache = {}

        # Signal fusion weights and thresholds
        self.weights = self.config.get("skill_signal_weights", {
            "exact": 0.45, "fuzzy": 0.2, "semantic": 0.2, "context": 0.15
        })
        self.fuzzy_threshold = self.config.get("fuzzy_threshold", 80)
        self.semantic_threshold = self.config.get("semantic_threshold", 0.55)
        self.context_threshold = 0.3
        self.fusion_threshold = 0.5

        # Context keywords for domain-aware matching
        self.context_map = self.config.get("context_map", {})


    # -------------------------------
    # CV Chunks Preparation
    # -------------------------------
    def _prepare_cv_chunks(self, cv_text: str) -> list[str]:
        """Prepare paragraphs and sentences, deduplicate, sort and truncate"""
        min_len = self.config.get("min_chunk_length", 10)
        max_chunks = self.config.get("max_cv_chunks", 100)

        paragraphs = [line.strip() for line in cv_text.split('\n') if line.strip() and len(line.strip()) > min_len]

        sentences = []
        for para in paragraphs:
            for sent in re.split(r'[.!?]+', para):
                sent = sent.strip()
                if sent and len(sent) > min_len:
                    sentences.append(sent)

        all_chunks = list(set(paragraphs + sentences))
        all_chunks.sort(key=len, reverse=True)

        return all_chunks[:max_chunks]

    # -------------------------------
    # Exact Match (fastest)
    # -------------------------------
    def _exact_match_batch(self, skills: list[str], cv_lower: str) -> dict[str, float]:
        return {skill: 1.0 if skill.lower() in cv_lower else 0.0 for skill in skills}

    # -------------------------------
    # Fuzzy Match (batch)
    # -------------------------------
    def _fuzzy_match_batch(self, skills: list[str], cv_text: str) -> dict[str, float]:
        cv_lines = [line.strip() for line in cv_text.split('\n') if line.strip()]
        results = {}

        for skill in skills:
            skill_lower = skill.lower()
            cache_key = f"{skill_lower}:{hashlib.md5(cv_text[:500].encode()).hexdigest()}"
            if cache_key in self.fuzzy_cache:
                results[skill] = self.fuzzy_cache[cache_key]
                continue

            best_score = max((fuzz.token_set_ratio(skill_lower, line) for line in cv_lines), default=0)
            score_norm = best_score / 100.0
            results[skill] = score_norm
            self.fuzzy_cache[cache_key] = score_norm

        return results

    # -------------------------------
    # Semantic Match (batch + FAISS)
    # -------------------------------
    def _semantic_match_batch(self, skills: list[str], cv_chunks: list[str], cv_embeddings: np.ndarray) -> dict[str, float]:
        if not cv_chunks or len(cv_embeddings) == 0:
            return {skill: 0.0 for skill in skills}

        cv_embs_norm = cv_embeddings.copy()
        faiss.normalize_L2(cv_embs_norm)

        skills_to_embed = []
        skill_embeddings_list = []

        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in self.skill_embedding_cache:
                skill_embeddings_list.append(self.skill_embedding_cache[skill_lower])
            else:
                skills_to_embed.append(skill_lower)

        if skills_to_embed:
            new_embeddings = self.embedder.embed_texts(skills_to_embed)
            for skill_lower, emb in zip(skills_to_embed, new_embeddings):
                self.skill_embedding_cache[skill_lower] = emb
                skill_embeddings_list.append(emb)

        skill_embs_array = np.array(skill_embeddings_list)
        faiss.normalize_L2(skill_embs_array)

        similarity_matrix = np.dot(skill_embs_array, cv_embs_norm.T)

        results = {}
        for i, skill in enumerate(skills):
            best_score = float(np.max(similarity_matrix[i]))
            results[skill] = best_score

        return results

    # -------------------------------
    # Context Match
    # -------------------------------
    def _context_match_batch(self, skills: list[str], cv_lower: str) -> dict[str, float]:
        results = {}
        window_size = 200

        if not self.context_map:
            return {skill: 0.0 for skill in skills}

        for skill in skills:
            skill_lower = skill.lower()
            context_keywords = self.context_map.get(skill_lower, [])
            if not context_keywords:
                results[skill] = 0.0
                continue

            positions = [m.start() for m in re.finditer(re.escape(skill_lower), cv_lower)]
            if not positions:
                results[skill] = 0.0
                continue

            max_score = 0.0
            for pos in positions:
                window_start = max(0, pos - window_size)
                window_end = min(len(cv_lower), pos + window_size)
                window = cv_lower[window_start:window_end]
                matches = sum(1 for kw in context_keywords if kw in window)
                max_score = max(max_score, matches / len(context_keywords))

            results[skill] = max_score

        return results

    # -------------------------------
    # Signal Fusion
    # -------------------------------
    def _fuse_signals(self, exact: float, fuzzy: float, semantic: float, context: float) -> tuple[float, str]:
        fused = (
            self.weights["exact"] * exact +
            self.weights["fuzzy"] * fuzzy +
            self.weights["semantic"] * semantic +
            self.weights["context"] * context
        )

        # Determine primary agent
        if exact == 1.0:
            agent = "exact"
        elif fuzzy >= 0.75:
            agent = "fuzzy"
        elif semantic >= self.semantic_threshold:
            agent = "semantic"
        elif context >= self.context_threshold:
            agent = "context"
        else:
            agent = "fusion"

        return fused, agent

    # -------------------------------
    # Main Matching Function
    # -------------------------------
    @time_function
    def match_skills(self, cv_text: str, job_skills: list[str]) -> dict[str, Any]:
        cv_hash = hashlib.md5(cv_text.encode()).hexdigest()

        if cv_hash not in self.cv_cache:
            cv_chunks = self._prepare_cv_chunks(cv_text)
            cv_embeddings = self.embedder.embed_texts(cv_chunks) if cv_chunks else np.array([])
            self.cv_cache[cv_hash] = (cv_chunks, cv_embeddings)

        cv_chunks, cv_embeddings = self.cv_cache[cv_hash]
        cv_lower = cv_text.lower()

        unique_skills = list(set(skill.strip() for skill in job_skills if skill.strip()))

        exact_scores = self._exact_match_batch(unique_skills, cv_lower)
        fuzzy_scores = self._fuzzy_match_batch(unique_skills, cv_text)
        semantic_scores = self._semantic_match_batch(unique_skills, cv_chunks, cv_embeddings)
        context_scores = self._context_match_batch(unique_skills, cv_lower)

        skill_details = {}
        matched_skills = []
        agent_matches = {"exact": [], "fuzzy": [], "semantic": [], "context": [], "fusion": []}

        for skill in unique_skills:
            fused, agent = self._fuse_signals(
                exact_scores[skill],
                fuzzy_scores[skill],
                semantic_scores[skill],
                context_scores[skill]
            )
            matched = fused >= self.fusion_threshold
            skill_details[skill] = {
                "skill": skill,
                "matched": matched,
                "confidence": round(fused, 3),
                "agent": agent,
                "signals": {
                    "exact": round(exact_scores[skill], 3),
                    "fuzzy": round(fuzzy_scores[skill], 3),
                    "semantic": round(semantic_scores[skill], 3),
                    "context": round(context_scores[skill], 3)
                }
            }
            if matched:
                matched_skills.append(skill)
                agent_matches[agent].append(skill_details[skill])

        total_skills = len(job_skills)
        matched_count = len(matched_skills)
        match_percentage = round(matched_count / total_skills * 100, 2) if total_skills else 0.0
        missing_skills = [s for s in job_skills if s.strip() not in matched_skills]
        agent_percentages = {a: round(len(agent_matches[a]) / total_skills * 100, 2) if total_skills else 0.0
                             for a in agent_matches}

        return {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_percentage": match_percentage,
            "total_skills": total_skills,
            "matched_count": matched_count,
            "agent_matches": agent_matches,
            "agent_percentages": agent_percentages,
            "skill_details": skill_details,
            "cache_stats": {
                "cv_chunks_count": len(cv_chunks),
                "skill_embeddings_cached": len(self.skill_embedding_cache),
                "cv_cache_size": len(self.cv_cache)
            }
        }

    # -------------------------------
    # Cache Management
    # -------------------------------
    def clear_cache(self, cache_type: str = "all"):
        if cache_type in ["all", "skills"]:
            self.skill_embedding_cache.clear()
        if cache_type in ["all", "cv"]:
            self.cv_cache.clear()
        if cache_type in ["all", "fuzzy"]:
            self.fuzzy_cache.clear()
