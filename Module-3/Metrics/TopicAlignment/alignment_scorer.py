"""
Topic Alignment scorer — measures how well a generated question aligns
with the provided job context (job_title, skills, experience_level)
using sentence-transformer embeddings + cosine similarity.

Scoring per question:
  - job_title_similarity:   cosine(question, job_title)
  - skills_similarity:      mean cosine(question, each skill)
  - experience_similarity:  cosine(question, "<level> level <job_title>")
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ── Model cache (same pattern as similarity_scorer.py) ────────

_model_cache: dict[str, SentenceTransformer] = {}
DEFAULT_MODEL = "mixedbread-ai/mxbai-embed-large-v1"




def _get_model(model_name: str = DEFAULT_MODEL) -> SentenceTransformer:
    """Load and cache a sentence-transformer model."""
    if model_name not in _model_cache:
        _model_cache[model_name] = SentenceTransformer(model_name)
    return _model_cache[model_name]


def _cosine(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Cosine similarity between two 1-D vectors."""
    score = cosine_similarity([vec_a], [vec_b])[0][0]
    return round(float(score), 4)


# ── Core scoring ──────────────────────────────────────────────

def score_question(
    question: str,
    job_title: str,
    skills: list[str],
    experience_level: str,
    model_name: str = DEFAULT_MODEL,
) -> dict:
    """
    Score a single question against the job context.

    Returns:
        {
            "question": str,
            "job_title_similarity": float,
            "skills_similarity": float,
            "per_skill_scores": dict,
        }
    """
    model = _get_model(model_name)

    # Build all texts to embed in one batch for efficiency
    texts_to_embed = [question, job_title] + skills
    embeddings = model.encode(texts_to_embed, normalize_embeddings=True)

    q_emb = embeddings[0]
    jt_emb = embeddings[1]
    skill_embs = embeddings[2:]

    # 1. Job title similarity
    job_title_sim = _cosine(q_emb, jt_emb)

    # 2. Skills similarity (max over all skills — best-matching skill wins)
    per_skill_scores = {}
    if len(skill_embs) > 0:
        for skill, s_emb in zip(skills, skill_embs):
            per_skill_scores[skill] = _cosine(q_emb, s_emb)
        skills_sim = round(float(max(per_skill_scores.values())), 4)
    else:
        skills_sim = 0.0

    return {
        "question": question,
        "job_title_similarity": job_title_sim,
        "skills_similarity": skills_sim,
        "per_skill_scores": per_skill_scores,
    }


def score_questions(
    questions: list[str],
    job_title: str,
    skills: list[str],
    experience_level: str,
    model_name: str = DEFAULT_MODEL,
) -> list[dict]:
    """Score a batch of questions against the same job context."""
    return [
        score_question(q, job_title, skills, experience_level, model_name)
        for q in questions
        if q and q.strip()
    ]
