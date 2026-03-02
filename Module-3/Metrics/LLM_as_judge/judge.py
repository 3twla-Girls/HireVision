"""
LLM-as-a-Judge — core logic for auditing each pipeline stage.
Uses Groq LLM to judge the quality of generated questions, answers, and evaluations.
"""

import json
import os
import time
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).parent.parent.parent / ".env"


def _get_client() -> Groq:
    """Create a fresh Groq client, reloading .env each time."""
    load_dotenv(_ENV_PATH, override=True)
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def _get_model() -> str:
    return os.getenv("JUDGE_MODEL", "llama-3.3-70b-versatile")

# ── Load Prompts ──────────────────────────────────────────────
PROMPTS_DIR = Path(__file__).parent / "prompts"
PROMPT_QUESTION = (PROMPTS_DIR / "judge_question_quality.txt").read_text(encoding="utf-8")
PROMPT_ANSWER = (PROMPTS_DIR / "judge_answer_quality.txt").read_text(encoding="utf-8")
PROMPT_EVAL = (PROMPTS_DIR / "judge_evaluation_fairness.txt").read_text(encoding="utf-8")
PROMPT_OVERALL = (PROMPTS_DIR / "judge_overall_quality.txt").read_text(encoding="utf-8")


def _call_llm(prompt: str) -> dict:
    """Send prompt to LLM, parse JSON response."""
    response = _get_client().chat.completions.create(
        model=_get_model(),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content

    # Strip markdown code fences if the LLM wraps its JSON (e.g. ```json ... ```)
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:]  # Remove opening ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]  # Remove closing ```
        raw = "\n".join(lines).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON from judge", "raw": raw[:300]}


# ── Judge: Question Quality ──────────────────────────────────

def judge_question(question: str, job_title: str, skills: list[str], experience_level: str) -> dict:
    """
    Judge a single generated question for relevance, clarity, and difficulty.
    Returns: { relevance, clarity, difficulty_calibration, reasoning }
    """
    prompt = PROMPT_QUESTION.format(
        question=question,
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
    )
    return _call_llm(prompt)


# ── Judge: Reference Answer Quality ─────────────────────────

def judge_answer(question: str, reference_answer: str, job_title: str, skills: list[str], experience_level: str, question_type: str = "conceptual", options: list[str] = None) -> dict:
    """
    Judge a reference answer for correctness, completeness, and alignment.
    Returns: { correctness, completeness, question_alignment, reasoning }
    """
    # Build options section for MCQ questions
    if question_type == "mcq" and options:
        labels = ["A", "B", "C", "D", "E", "F", "G", "H"]
        options_text = "\n".join(f"  {labels[i]}. {opt}" for i, opt in enumerate(options) if i < len(labels))
        options_section = f"Options:\n{options_text}"
    else:
        options_section = ""

    prompt = PROMPT_ANSWER.format(
        question=question,
        reference_answer=reference_answer,
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
        question_type=question_type,
        options_section=options_section,
    )
    return _call_llm(prompt)


# ── Simulate: Candidate Answer ───────────────────────────────

def simulate_candidate_answer(question: str, job_title: str, experience_level: str) -> str:
    """
    Generate a realistic simulated candidate answer.
    The LLM role-plays as a candidate giving an imperfect, natural answer.
    """
    prompt = (
        f"You are a {experience_level}-level candidate interviewing for a {job_title} position.\n"
        f"Answer this interview question as a real candidate would — naturally, not perfectly.\n"
        f"Include some correct points but also miss some details or be slightly vague.\n"
        f"Keep your answer concise (2-4 sentences).\n\n"
        f"Question: {question}\n\n"
        f"Your answer:"
    )
    response = _get_client().chat.completions.create(
        model=_get_model(),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


# ── Judge: Evaluation Fairness ───────────────────────────────

def judge_evaluation(
    question: str,
    reference_answer: str,
    candidate_answer: str,
    evaluation: dict,
) -> dict:
    """
    Judge the LLM evaluator's output for faithfulness and bias.
    Returns: { judge_score, faithfulness, bias_detected, reasoning }
    """
    prompt = PROMPT_EVAL.format(
        question=question,
        reference_answer=reference_answer,
        candidate_answer=candidate_answer,
        evaluation=json.dumps(evaluation, indent=2),
    )
    return _call_llm(prompt)

# ── Judge: Overall System Quality ────────────────────────────

def judge_overall(
    questions_text: str,
    answers_text: str,
    evaluation_text: str,
    job_title: str,
    skills: list[str],
    experience_level: str,
) -> dict:
    """
    Judge the overall system output for consistency, fluency, efficiency, helpfulness.
    Returns: { consistency, fluency, efficiency, helpfulness, reasoning }
    """
    # Escape curly braces in dynamic text so .format() doesn't break
    safe = lambda s: s.replace("{", "{{").replace("}", "}}")

    prompt = PROMPT_OVERALL.format(
        questions_text=safe(questions_text),
        answers_text=safe(answers_text),
        evaluation_text=safe(evaluation_text),
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
    )
    return _call_llm(prompt)

