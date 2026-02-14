"""
Pydantic models for the Perplexity metric endpoints.
"""

from pydantic import BaseModel, Field


# ── Requests ──────────────────────────────────────────────────

class PipelinePerplexityRequest(BaseModel):
    """Runs the full pipeline, then computes perplexity on the generated texts."""
    job_title: str
    skills: list[str]
    experience_level: str
    num_questions: int = 5
    model_id: str = Field(default="gpt2", description="HuggingFace causal LM for perplexity calculation")


class TextPerplexityRequest(BaseModel):
    """Computes perplexity on raw text input directly."""
    texts: list[str] = Field(min_length=1, description="List of text strings to evaluate")
    model_id: str = Field(default="gpt2", description="HuggingFace causal LM for perplexity calculation")


# ── Responses ─────────────────────────────────────────────────

class CategoryPerplexity(BaseModel):
    """Perplexity breakdown for a single category (e.g. questions, answers)."""
    category: str
    texts: list[str]
    perplexities: list[float]
    mean_perplexity: float


class PipelinePerplexityResponse(BaseModel):
    """Full pipeline perplexity result with per-category breakdown."""
    categories: list[CategoryPerplexity]
    all_perplexities: list[float]
    overall_mean_perplexity: float
    model_id: str


class TextPerplexityResponse(BaseModel):
    """Perplexity result for raw text input."""
    texts: list[str]
    perplexities: list[float]
    mean_perplexity: float
    model_id: str
