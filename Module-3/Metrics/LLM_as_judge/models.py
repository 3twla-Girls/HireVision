"""
Pydantic models for audit requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request ───────────────────────────────────────────────────

class AuditRequest(BaseModel):
    """Input for all audit endpoints."""
    job_title: str
    skills: list[str]
    experience_level: str
    num_questions: int = 5


# ── Per-Item Scores ──────────────────────────────────────────

class QuestionScore(BaseModel):
    question: str
    relevance: float = Field(ge=0, le=10)
    clarity: float = Field(ge=0, le=10)
    difficulty_calibration: float = Field(ge=0, le=10)
    reasoning: str


class AnswerScore(BaseModel):
    question: str
    reference_answer: str
    correctness: float = Field(ge=0, le=10)
    completeness: float = Field(ge=0, le=10)
    question_alignment: float = Field(ge=0, le=10)
    reasoning: str


class EvaluationScore(BaseModel):
    question: str
    candidate_answer: str
    original_score: float
    judge_score: float = Field(ge=0, le=10)
    faithfulness: float = Field(ge=0, le=10)
    bias_detected: bool
    reasoning: str


# ── Audit Responses ──────────────────────────────────────────

class QuestionsAuditResponse(BaseModel):
    per_question_scores: list[QuestionScore]
    average_relevance: float
    average_clarity: float
    average_difficulty_calibration: float
    overall_score: float
    latency_ms: float


class AnswersAuditResponse(BaseModel):
    per_answer_scores: list[AnswerScore]
    average_correctness: float
    average_completeness: float
    average_alignment: float
    overall_score: float
    latency_ms: float


class EvaluationAuditResponse(BaseModel):
    per_evaluation_scores: list[EvaluationScore]
    average_faithfulness: float
    average_judge_score: float
    bias_count: int
    overall_score: float
    latency_ms: float


class QuestionsSummary(BaseModel):
    """How good are the generated interview questions?"""
    average_relevance: float = Field(description="Are questions relevant to the job and skills? (0-10)")
    average_clarity: float = Field(description="Are questions clear and unambiguous? (0-10)")
    average_difficulty_calibration: float = Field(description="Is difficulty appropriate for the experience level? (0-10)")
    overall_score: float = Field(description="Overall question generation quality (0-10)")


class AnswersSummary(BaseModel):
    """How good are the generated reference answers?"""
    average_correctness: float = Field(description="Are reference answers factually correct? (0-10)")
    average_completeness: float = Field(description="Do answers cover all key points? (0-10)")
    average_alignment: float = Field(description="Do answers directly address the questions? (0-10)")
    overall_score: float = Field(description="Overall reference answer quality (0-10)")


class EvaluationSummary(BaseModel):
    """How fair and accurate is the answer evaluation?"""
    average_faithfulness: float = Field(description="Does the evaluator stay faithful to the actual answer content? (0-10)")
    average_judge_score: float = Field(description="Overall quality of the evaluation judgments (0-10)")
    bias_count: int = Field(description="Number of evaluations where bias was detected")
    overall_score: float = Field(description="Overall evaluation fairness (0-10)")


class FullAuditResponse(BaseModel):
    question_generation: QuestionsSummary
    answer_generation: AnswersSummary
    evaluation_fairness: EvaluationSummary

    # Overall system metrics
    consistency: float = Field(description="Measures how reproducible and logically consistent the generated questions, answers, and evaluations are. Score from 0 (inconsistent) to 10 (fully consistent).")
    fluency: float = Field(description="Is all generated text well-written, grammatically correct, and easy to read? (0-10)")
    helpfulness: float = Field(description="Would this output be genuinely useful for conducting a real interview? (0-10)")
    overall_reasoning: str = Field(description="The judge's explanation for the overall scores")
    system_overall_score: float = Field(description="Average of all stage scores and overall metrics (0-10)")
