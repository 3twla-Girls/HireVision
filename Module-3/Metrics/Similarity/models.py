"""
Pydantic models for the Similarity metric endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Requests ──────────────────────────────────────────────────

class TextPair(BaseModel):
    """A single (generated, reference) text pair."""
    generated: str = Field(description="LLM-generated text")
    reference: str = Field(description="Ground-truth / reference text")


class TextSimilarityRequest(BaseModel):
    """Compare arbitrary pairs of generated vs. reference text."""
    pairs: list[TextPair] = Field(min_length=1)
    model_name: str = Field(
        default="mixedbread-ai/mxbai-embed-large-v1",
        description="Sentence-transformer model to use for embeddings",
    )


class GeneratedAnswer(BaseModel):
    """A single generated Q&A to compare against the dataset."""
    question: str
    answer: str


class DatasetSimilarityRequest(BaseModel):
    """Compare user-provided answers against the ground-truth dataset."""
    generated_answers: list[GeneratedAnswer] = Field(min_length=1)
    category: Optional[str] = Field(default=None, description="Filter dataset by category (e.g. DevOps, Security)")
    difficulty: Optional[str] = Field(default=None, description="Filter dataset by difficulty (Easy, Medium, Hard)")
    skill: Optional[str] = Field(default=None, description="Filter dataset by skill")
    model_name: str = Field(default="mixedbread-ai/mxbai-embed-large-v1")


class PipelineSimilarityRequest(BaseModel):
    """
    Send dataset questions to the Answer-Generation service,
    then compare LLM answers vs. dataset ground-truth answers.
    """
    job_title: str = Field(description="Job role context for answer generation")
    skills: list[str] = Field(description="Skills context for answer generation")
    experience_level: str = Field(description="Experience level (Easy, Medium, Hard)")
    num_questions: Optional[int] = Field(default=5, ge=1, description="Max number of dataset questions to evaluate")
    category: Optional[str] = Field(default=None, description="Filter dataset by category")
    difficulty: Optional[str] = Field(default=None, description="Filter dataset by difficulty")
    skill: Optional[str] = Field(default=None, description="Filter dataset by skill")
    model_name: str = Field(default="mixedbread-ai/mxbai-embed-large-v1")


# ── Responses ─────────────────────────────────────────────────

class PairSimilarityResult(BaseModel):
    """Similarity result for a single text pair."""
    generated: str
    reference: str
    similarity: float = Field(ge=-1, le=1)


class TextSimilarityResponse(BaseModel):
    """Response for the /text endpoint."""
    results: list[PairSimilarityResult]
    mean_similarity: float
    model_name: str


class AnswerComparisonResult(BaseModel):
    """Comparison of one LLM answer vs. one dataset answer."""
    question: str
    dataset_answer: str
    generated_answer: str
    similarity: float = Field(ge=-1, le=1)
    category: str = ""
    difficulty: str = ""
    skill: str = ""


class CategoryBreakdown(BaseModel):
    """Average similarity grouped by category/difficulty/skill."""
    label: str
    count: int
    mean_similarity: float


class DatasetSimilarityResponse(BaseModel):
    """Response for the /dataset endpoint."""
    results: list[AnswerComparisonResult]
    mean_similarity: float
    by_category: list[CategoryBreakdown] = []
    by_difficulty: list[CategoryBreakdown] = []
    dataset_size: int
    model_name: str


class PipelineSimilarityResponse(BaseModel):
    """Response for the /pipeline endpoint."""
    results: list[AnswerComparisonResult]
    mean_similarity: float
    by_category: list[CategoryBreakdown] = []
    by_difficulty: list[CategoryBreakdown] = []
    dataset_size: int
    model_name: str
    num_questions_evaluated: int
