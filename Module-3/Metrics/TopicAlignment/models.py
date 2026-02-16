"""
Pydantic models for the Topic Alignment metric endpoint.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request ──────────────────────────────────────────────────

class TopicAlignmentRequest(BaseModel):
    """
    Generates questions via the Question-Generation service, then
    measures how well each question aligns with the job context.
    """
    job_title: str = Field(description="Target job role")
    skills: list[str] = Field(description="Required skills for the role")
    experience_level: str = Field(description="Experience level (Junior, Mid, Senior)")
    num_questions: int = Field(default=5, ge=1, description="Number of questions to generate")
    model_name: str = Field(
        default="mixedbread-ai/mxbai-embed-large-v1",
        description="Sentence-transformer model for embeddings",
    )
    coverage_threshold: float = Field(
        default=0.6, ge=0, le=1,
        description="Min cosine similarity for a question to be considered covering a skill",
    )


# ── Response ─────────────────────────────────────────────────

class QuestionAlignmentResult(BaseModel):
    """Alignment scores for a single generated question."""
    question: str
    job_title_similarity: float = Field(ge=-1, le=1)
    skills_similarity: float = Field(ge=-1, le=1, description="Max similarity across all skills")
    per_skill_scores: dict[str, float] = Field(default={}, description="Cosine similarity per individual skill")


class SkillCoverage(BaseModel):
    """How many questions cover a given skill."""
    skill: str
    question_count: int = Field(description="Number of questions covering this skill")
    questions: list[str] = Field(description="Questions that cover this skill")


class TopicAlignmentResponse(BaseModel):
    """Full response for the /pipeline endpoint."""
    results: list[QuestionAlignmentResult]
    skill_coverage: list[SkillCoverage] = Field(description="How many questions cover each skill")
    mean_job_title_similarity: float
    mean_skills_similarity: float
    num_questions_evaluated: int
    coverage_threshold: float
    model_name: str
    job_title: str
    skills: list[str]
    experience_level: str
