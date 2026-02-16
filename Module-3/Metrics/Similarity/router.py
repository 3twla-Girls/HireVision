"""
Similarity metric endpoints — computes semantic similarity between
LLM-generated answers and ground-truth reference answers from the dataset
using sentence-transformer embeddings + cosine similarity.

Flow for /pipeline:
  1. Read questions from the ground-truth CSV dataset
  2. Send them to Groq (via local answer_generator) → get LLM answers
  3. Compare LLM answers vs. dataset answers using cosine similarity
"""

import sys
from pathlib import Path
from collections import defaultdict

from fastapi import APIRouter

import similarity_scorer
import answer_generator
from models import (
    TextSimilarityRequest,
    TextSimilarityResponse,
    PairSimilarityResult,
    DatasetSimilarityRequest,
    DatasetSimilarityResponse,
    PipelineSimilarityRequest,
    PipelineSimilarityResponse,
    AnswerComparisonResult,
    CategoryBreakdown,
)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────

def _compute_breakdowns(
    results: list[AnswerComparisonResult],
) -> tuple[list[CategoryBreakdown], list[CategoryBreakdown]]:
    """Build category and difficulty breakdowns."""
    by_cat: dict[str, list[float]] = defaultdict(list)
    by_diff: dict[str, list[float]] = defaultdict(list)

    for r in results:
        if r.category:
            by_cat[r.category].append(r.similarity)
        if r.difficulty:
            by_diff[r.difficulty].append(r.similarity)

    cat_bd = [
        CategoryBreakdown(
            label=label,
            count=len(scores),
            mean_similarity=round(sum(scores) / len(scores), 4),
        )
        for label, scores in sorted(by_cat.items())
    ]
    diff_bd = [
        CategoryBreakdown(
            label=label,
            count=len(scores),
            mean_similarity=round(sum(scores) / len(scores), 4),
        )
        for label, scores in sorted(by_diff.items())
    ]

    return cat_bd, diff_bd


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/text", response_model=TextSimilarityResponse)
async def similarity_text(req: TextSimilarityRequest):
    """
    Compare arbitrary (generated, reference) text pairs.
    No dataset or external service needed.
    """
    pairs = [{"generated": p.generated, "reference": p.reference} for p in req.pairs]
    result = similarity_scorer.compute_batch_similarity(
        pairs=pairs, model_name=req.model_name,
    )

    pair_results = [
        PairSimilarityResult(
            generated=p.generated,
            reference=p.reference,
            similarity=sim,
        )
        for p, sim in zip(req.pairs, result["similarities"])
    ]

    return TextSimilarityResponse(
        results=pair_results,
        mean_similarity=result["mean_similarity"],
        model_name=req.model_name,
    )


@router.post("/dataset", response_model=DatasetSimilarityResponse)
async def similarity_dataset(req: DatasetSimilarityRequest):
    """
    Compare user-provided generated answers against dataset answers.
    You provide the generated answers directly — no external service called.
    """
    references = similarity_scorer.load_ground_truth(
        category=req.category,
        difficulty=req.difficulty,
        skill=req.skill,
    )

    if not references:
        return DatasetSimilarityResponse(
            results=[], mean_similarity=0.0,
            dataset_size=0, model_name=req.model_name,
        )

    results = []
    for ga in req.generated_answers:
        top = similarity_scorer.find_most_similar(
            generated_text=ga.answer,
            references=references,
            model_name=req.model_name,
            top_k=1,
        )
        best = top[0] if top else {}
        results.append(AnswerComparisonResult(
            question=ga.question,
            dataset_answer=best.get("answer", ""),
            generated_answer=ga.answer,
            similarity=best.get("similarity", 0.0),
            category=best.get("category", ""),
            difficulty=best.get("difficulty", ""),
            skill=best.get("skill", ""),
        ))

    all_sims = [r.similarity for r in results]
    mean_sim = round(sum(all_sims) / len(all_sims), 4) if all_sims else 0.0
    cat_bd, diff_bd = _compute_breakdowns(results)

    return DatasetSimilarityResponse(
        results=results,
        mean_similarity=mean_sim,
        by_category=cat_bd,
        by_difficulty=diff_bd,
        dataset_size=len(references),
        model_name=req.model_name,
    )


@router.post("/pipeline", response_model=PipelineSimilarityResponse)
async def similarity_pipeline(req: PipelineSimilarityRequest):
    """
    The main evaluation pipeline (fully self-contained, no external services):
      1. Load questions from the ground-truth CSV (filtered by category/difficulty/skill)
      2. Send those questions to Groq API → get LLM-generated answers
      3. Compare each LLM answer vs. the dataset answer using cosine similarity

    This measures: "Given the SAME question, how similar is the LLM's answer
    to the expert's answer in the dataset?"
    """
    # 1. Load dataset rows (filtered)
    dataset_rows = similarity_scorer.load_ground_truth(
        category=req.category,
        difficulty=req.difficulty,
        skill=req.skill,
    )

    if not dataset_rows:
        return PipelineSimilarityResponse(
            results=[], mean_similarity=0.0,
            dataset_size=0, model_name=req.model_name,
            num_questions_evaluated=0,
        )

    # Limit to num_questions
    rows_to_eval = dataset_rows[:req.num_questions] if req.num_questions else dataset_rows

    # 2. Extract questions and send to Groq for answer generation
    questions = [row["question"] for row in rows_to_eval]

    generated = answer_generator.generate_answers(
        questions=questions,
        job_title=req.job_title,
        skills=req.skills,
        experience_level=req.experience_level,
    )

    # 3. Compare each LLM answer vs. dataset answer
    results = []
    for row, gen in zip(rows_to_eval, generated):
        gen_answer = gen.get("generated_answer", "")
        dataset_answer = row["answer"]

        if not gen_answer.strip():
            continue

        sim = similarity_scorer.compute_similarity(
            generated=gen_answer,
            reference=dataset_answer,
            model_name=req.model_name,
        )

        results.append(AnswerComparisonResult(
            question=row["question"],
            dataset_answer=dataset_answer,
            generated_answer=gen_answer,
            similarity=sim,
            category=row.get("category", ""),
            difficulty=row.get("difficulty", ""),
            skill=row.get("skill", ""),
        ))

    # 4. Compute overall stats
    all_sims = [r.similarity for r in results]
    mean_sim = round(sum(all_sims) / len(all_sims), 4) if all_sims else 0.0
    cat_bd, diff_bd = _compute_breakdowns(results)

    return PipelineSimilarityResponse(
        results=results,
        mean_similarity=mean_sim,
        by_category=cat_bd,
        by_difficulty=diff_bd,
        dataset_size=len(dataset_rows),
        model_name=req.model_name,
        num_questions_evaluated=len(results),
    )
