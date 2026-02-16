"""
Similarity scorer — computes semantic similarity between generated text
and reference text using sentence-transformer embeddings + cosine similarity.

Uses 'all-MiniLM-L6-v2' by default (~80 MB, fast, CPU-friendly).
Higher similarity = generated text is closer in meaning to the reference.
"""

import csv
import os
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ── Model cache ───────────────────────────────────────────────
_model_cache: dict[str, SentenceTransformer] = {}

DEFAULT_MODEL = "mixedbread-ai/mxbai-embed-large-v1"
DATA_DIR = Path(__file__).parent / "data"
DEFAULT_CSV = DATA_DIR / "ground_truth.csv"


def _get_model(model_name: str = DEFAULT_MODEL) -> SentenceTransformer:
    """Load and cache a sentence-transformer model."""
    if model_name not in _model_cache:
        _model_cache[model_name] = SentenceTransformer(model_name)
    return _model_cache[model_name]


# ── Dataset helpers ───────────────────────────────────────────

def load_ground_truth(
    csv_path: str | Path | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    skill: str | None = None,
) -> list[dict]:
    """
    Load the ground-truth Q&A dataset from CSV and optionally filter.

    Each row is returned as:
        { "question", "answer", "category", "difficulty", "skill" }
    """
    path = Path(csv_path) if csv_path else DEFAULT_CSV
    if not path.exists():
        raise FileNotFoundError(
            f"Ground-truth CSV not found at {path}. "
            "Please place your dataset at Metrics/Similarity/data/ground_truth.csv"
        )

    rows: list[dict] = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normalise keys to lowercase
            normalised = {k.strip().lower(): v.strip() for k, v in row.items()}
            rows.append(normalised)

    # Apply filters (case-insensitive partial match)
    if category:
        cat_lower = category.lower()
        rows = [r for r in rows if cat_lower in r.get("category", "").lower()]
    if difficulty:
        diff_lower = difficulty.lower()
        rows = [r for r in rows if diff_lower in r.get("difficulty", "").lower()]
    if skill:
        skill_lower = skill.lower()
        rows = [r for r in rows if skill_lower in r.get("skill", "").lower()]

    return rows


# ── Core scoring functions ────────────────────────────────────

def compute_similarity(
    generated: str,
    reference: str,
    model_name: str = DEFAULT_MODEL,
) -> float:
    """
    Compute cosine similarity between a single generated text
    and a single reference text.  Returns a float in [0, 1].
    """
    model = _get_model(model_name)
    embeddings = model.encode([generated, reference], normalize_embeddings=True)
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return round(float(score), 4)


def compute_batch_similarity(
    pairs: list[dict],
    model_name: str = DEFAULT_MODEL,
) -> dict:
    """
    Compute cosine similarity for a batch of (generated, reference) pairs.

    Args:
        pairs: list of {"generated": str, "reference": str}

    Returns:
        {
            "similarities": [float, ...],
            "mean_similarity": float,
        }
    """
    if not pairs:
        return {"similarities": [], "mean_similarity": 0.0}

    model = _get_model(model_name)

    gen_texts = [p["generated"] for p in pairs]
    ref_texts = [p["reference"] for p in pairs]

    gen_embs = model.encode(gen_texts, normalize_embeddings=True)
    ref_embs = model.encode(ref_texts, normalize_embeddings=True)

    # Row-wise cosine similarity (each generated vs its own reference)
    similarities = [
        round(float(cosine_similarity([g], [r])[0][0]), 4)
        for g, r in zip(gen_embs, ref_embs)
    ]

    mean_sim = round(float(np.mean(similarities)), 4) if similarities else 0.0

    return {
        "similarities": similarities,
        "mean_similarity": mean_sim,
    }


def find_most_similar(
    generated_text: str,
    references: list[dict],
    model_name: str = DEFAULT_MODEL,
    top_k: int = 3,
) -> list[dict]:
    """
    Find the top-k most similar reference entries to a generated text.

    Args:
        generated_text: the LLM-generated text to compare
        references:     list of dicts with at least an "answer" key
        top_k:          number of closest matches to return

    Returns:
        list of dicts, each with the original reference fields + "similarity" score
    """
    if not references or not generated_text.strip():
        return []

    model = _get_model(model_name)

    ref_texts = [r.get("answer", "") for r in references]
    gen_emb = model.encode([generated_text], normalize_embeddings=True)
    ref_embs = model.encode(ref_texts, normalize_embeddings=True)

    scores = cosine_similarity(gen_emb, ref_embs)[0]

    # Pair scores with references and sort descending
    scored = []
    for idx, score in enumerate(scores):
        entry = {**references[idx], "similarity": round(float(score), 4)}
        scored.append(entry)

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]
