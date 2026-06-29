import re
import hashlib
import numpy as np
from typing import List, Dict, Any
from cachetools import LRUCache
from rapidfuzz import fuzz
from .CONFIG import CONFIG
from .utils import time_function
from ..helpers.job_skills import JobSkillsStore
from ..helpers.faiss_service import FAISSService

skills_embedder = JobSkillsStore()
class HybridSkillMatcher:
    """
    Hybrid Skill Matcher

    Signals used:
    1. Exact match
    2. Fuzzy match
    3. Semantic match (embeddings similarity)
    4. Context match

    Optimized for:
    - FAISS stored embeddings
    - CV embeddings already computed
    - Skill embedding caching
    """

    def __init__(self,config: dict = CONFIG):
        self.config = config
        self.fuzzy_cache = LRUCache(maxsize=1024)
        # weights
        self.weights = self.config.get(
            "skill_signal_weights",
            {"exact": 0.45, "fuzzy": 0.2, "semantic": 0.25, "context": 0.1}
        )

        self.fuzzy_threshold = self.config.get("fuzzy_threshold", 80)
        self.semantic_threshold = self.config.get("semantic_threshold", 0.55)
        self.context_threshold = 0.3
        self.fusion_threshold = 0.5

        # optional skill context keywords
        self.context_map = self.config.get("context_map", {})

    # ---------------------------------------------------
    # EXACT MATCH
    # ---------------------------------------------------

    def _exact_match_batch(self, skills: List[str], cv_lower: str):

        results = {}

        for skill in skills:
            results[skill] = 1.0 if skill.lower() in cv_lower else 0.0

        return results

    # ---------------------------------------------------
    # FUZZY MATCH
    # ---------------------------------------------------

    def _fuzzy_match_batch(self, skills: List[str], cv_text: str):

        cv_lines = [line.strip() for line in cv_text.split("\n") if line.strip()]
        results = {}

        for skill in skills:

            skill_lower = skill.lower()
            cache_key = f"{skill_lower}:{hashlib.md5(cv_text[:500].encode()).hexdigest()}"

            if cache_key in self.fuzzy_cache:
                results[skill] = self.fuzzy_cache[cache_key]
                continue

            best_score = max(
                (fuzz.token_set_ratio(skill_lower, line) for line in cv_lines),
                default=0
            )

            score_norm = best_score / 100.0

            results[skill] = score_norm
            self.fuzzy_cache[cache_key] = score_norm

        return results

    # ---------------------------------------------------
    # SEMANTIC MATCH (embedding similarity)
    # ---------------------------------------------------
    def _semantic_match_batch(self, job_id: str, cv_embedding: np.ndarray):
        results = {}
        job_entry = skills_embedder.get_job_skills(job_id)
        
        if not  job_entry:
            return {skill: 0.0 for skill in  job_entry.keys()}
        
        skills_emb = job_entry.get("skills_embeddings", {})
        for skill_name, skill_vec in skills_emb.items():
            skill_vec = np.array(skill_vec, dtype=np.float32).flatten()
            if skill_vec.shape != cv_embedding.shape:
                # Skip or log mismatch
                continue

            sim = np.dot(skill_vec, cv_embedding) / (
                np.linalg.norm(skill_vec) * np.linalg.norm(cv_embedding)
            )
            results[skill_name] = float(sim)

        return results

    # ---------------------------------------------------
    # CONTEXT MATCH
    # ---------------------------------------------------

    def _context_match_batch(self, skills: List[str], cv_lower: str):

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

            positions = [
                m.start() for m in re.finditer(re.escape(skill_lower), cv_lower)
            ]

            if not positions:
                results[skill] = 0.0
                continue

            max_score = 0

            for pos in positions:

                window_start = max(0, pos - window_size)
                window_end = min(len(cv_lower), pos + window_size)

                window = cv_lower[window_start:window_end]

                matches = sum(1 for kw in context_keywords if kw in window)

                max_score = max(max_score, matches / len(context_keywords))

            results[skill] = max_score

        return results

    # ---------------------------------------------------
    # SIGNAL FUSION
    # ---------------------------------------------------

    def _fuse_signals(self, exact, fuzzy, semantic, context):

        fused = (
            self.weights["exact"] * exact
            + self.weights["fuzzy"] * fuzzy
            + self.weights["semantic"] * semantic
            + self.weights["context"] * context
        )

        if exact == 1:
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

    # ---------------------------------------------------
    # MAIN MATCH FUNCTION
    # ---------------------------------------------------

    @time_function
    def match_skills(
        self,
        cv_text: str,
        job_skills: List[str],
        job_id:str,
        cv_embedding: np.ndarray
    ) -> Dict[str, Any]:

        cv_lower = cv_text.lower()

        unique_skills = list(set(skill.strip() for skill in job_skills if skill))

        exact_scores = self._exact_match_batch(unique_skills, cv_lower)
        fuzzy_scores = self._fuzzy_match_batch(unique_skills, cv_text)
        semantic_scores = self._semantic_match_batch(job_id, cv_embedding)
        context_scores = self._context_match_batch(unique_skills, cv_lower)

        matched_skills = []
        skill_details = {}

        for skill in unique_skills:

            fused, agent = self._fuse_signals(
                exact_scores[skill],
                fuzzy_scores[skill],
                semantic_scores[skill],
                context_scores[skill],
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
                    "context": round(context_scores[skill], 3),
                },
            }

            if matched:
                matched_skills.append(skill)

        total_skills = len(job_skills)
        matched_count = len(matched_skills)

        match_percentage = (
            round(matched_count / total_skills * 100, 2)
            if total_skills
            else 0
        )

        missing_skills = [
            s for s in job_skills if s.strip() not in matched_skills
        ]

        return {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_percentage": match_percentage,
            "matched_count": matched_count,
            "total_skills": total_skills,
            "skill_details": skill_details,
        }