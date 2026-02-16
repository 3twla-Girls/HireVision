"""
Topic Alignment metric endpoint — generates questions via the
Question-Generation service, then scores how well each question
aligns with the provided job context using sentence-transformer
embeddings + cosine similarity.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException

# Add parent Metrics dir to path so we can import the shared pipeline client
sys.path.insert(0, str(Path(__file__).parent.parent))

import pipeline_client
import alignment_scorer
from models import (
    TopicAlignmentRequest,
    TopicAlignmentResponse,
    QuestionAlignmentResult,
    SkillCoverage,
)

router = APIRouter()


@router.post("/pipeline", response_model=TopicAlignmentResponse)
async def topic_alignment_pipeline(req: TopicAlignmentRequest):
    """
    Full pipeline:
      1. Call Question-Generation service → get generated questions
      2. Embed each question + the job context with SentenceTransformer
      3. Compute cosine similarity per dimension (job_title, skills, experience)
      4. Return per-question and aggregate alignment scores
    """

    # 1. Fetch generated questions from the pipeline
    try:
        questions_data = await pipeline_client.fetch_questions(
            job_title=req.job_title,
            skills=req.skills,
            experience_level=req.experience_level,
            num_questions=req.num_questions,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Question-Generation service error: {exc}",
        )

    if not questions_data:
        return TopicAlignmentResponse(
            results=[],
            skill_coverage=[],
            mean_job_title_similarity=0.0,
            mean_skills_similarity=0.0,
            num_questions_evaluated=0,
            coverage_threshold=req.coverage_threshold,
            model_name=req.model_name,
            job_title=req.job_title,
            skills=req.skills,
            experience_level=req.experience_level,
        )

    # Extract question texts
    question_texts = [q.get("question", "") for q in questions_data]

    # 2–3. Score each question against the job context
    scored = alignment_scorer.score_questions(
        questions=question_texts,
        job_title=req.job_title,
        skills=req.skills,
        experience_level=req.experience_level,
        model_name=req.model_name,
    )

    # 4. Build response
    results = [
        QuestionAlignmentResult(
            question=s["question"],
            job_title_similarity=s["job_title_similarity"],
            skills_similarity=s["skills_similarity"],
            per_skill_scores=s["per_skill_scores"],
        )
        for s in scored
    ]

    mean_jt = round(sum(r.job_title_similarity for r in results) / len(results), 4) if results else 0.0
    mean_sk = round(sum(r.skills_similarity for r in results) / len(results), 4) if results else 0.0

    # 5. Compute skill coverage — how many questions cover each skill
    coverage: dict[str, list[str]] = {skill: [] for skill in req.skills}
    for r in results:
        for skill, score in r.per_skill_scores.items():
            if score >= req.coverage_threshold:
                coverage[skill].append(r.question)

    skill_coverage = [
        SkillCoverage(skill=skill, question_count=len(qs), questions=qs)
        for skill, qs in coverage.items()
    ]

    return TopicAlignmentResponse(
        results=results,
        skill_coverage=skill_coverage,
        mean_job_title_similarity=mean_jt,
        mean_skills_similarity=mean_sk,
        num_questions_evaluated=len(results),
        coverage_threshold=req.coverage_threshold,
        model_name=req.model_name,
        job_title=req.job_title,
        skills=req.skills,
        experience_level=req.experience_level,
    )
