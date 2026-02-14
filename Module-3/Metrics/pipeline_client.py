"""
Shared pipeline client — calls the Question-Generation and Answer-Evaluation
services via HTTP.  Used by all metric modules to avoid redundant code.
"""

import httpx

# ── Service URLs ──────────────────────────────────────────────
QUESTION_SERVICE_URL = "http://127.0.0.1:8001"
EVALUATION_SERVICE_URL = "http://127.0.0.1:8002"


async def fetch_questions(
    job_title: str,
    skills: list[str],
    experience_level: str,
    num_questions: int = 5,
    timeout: float = 120.0,
) -> list[dict]:
    """
    Call Question-Generation API → returns list of question dicts.
    Each dict has at least: { "question": str }
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions",
            json={
                "job_title": job_title,
                "skills": skills,
                "experience_level": experience_level,
                "num_questions": num_questions,
            },
        )
    response.raise_for_status()
    return response.json().get("questions", [])


async def fetch_questions_with_answers(
    job_title: str,
    skills: list[str],
    experience_level: str,
    num_questions: int = 5,
    timeout: float = 180.0,
) -> list[dict]:
    """
    Call Question-Generation API → returns list of Q&A dicts.
    Each dict has: { "question", "reference_answer", "question_type", ... }
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions-with-answers",
            json={
                "job_title": job_title,
                "skills": skills,
                "experience_level": experience_level,
                "num_questions": num_questions,
            },
        )
    response.raise_for_status()
    return response.json().get("questions_with_answers", [])


async def evaluate_answer(
    question: str,
    correct_answer: str,
    candidate_answer: str,
    timeout: float = 120.0,
) -> dict:
    """
    Call Answer-Evaluation API → returns evaluation result dict.
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{EVALUATION_SERVICE_URL}/api/answer-evaluation",
            json={
                "question": question,
                "correct_answer": correct_answer,
                "candidate_answer": candidate_answer,
            },
        )
    response.raise_for_status()
    return response.json()


async def run_full_pipeline(
    job_title: str,
    skills: list[str],
    experience_level: str,
    num_questions: int = 5,
    simulate_candidate_fn=None,
) -> dict:
    """
    Run the complete pipeline:
      1. Generate questions + reference answers
      2. Optionally simulate candidate answers & evaluate them

    Returns:
        {
            "qa_pairs": [...],
            "evaluations": [
                { "question", "reference_answer", "candidate_answer", "eval_result" }
            ]
        }
    """
    qa_pairs = await fetch_questions_with_answers(
        job_title=job_title,
        skills=skills,
        experience_level=experience_level,
        num_questions=num_questions,
        timeout=180.0,
    )

    evaluations = []
    if simulate_candidate_fn is not None:
        async with httpx.AsyncClient(timeout=180.0) as client:
            for item in qa_pairs:
                reference = item.get("reference_answer") or ""

                candidate = simulate_candidate_fn(
                    question=item["question"],
                    job_title=job_title,
                    experience_level=experience_level,
                )

                eval_response = await client.post(
                    f"{EVALUATION_SERVICE_URL}/api/answer-evaluation",
                    json={
                        "question": item["question"],
                        "correct_answer": reference,
                        "candidate_answer": candidate,
                    },
                )
                eval_response.raise_for_status()
                eval_result = eval_response.json()

                evaluations.append({
                    "question": item["question"],
                    "reference_answer": reference,
                    "candidate_answer": candidate,
                    "eval_result": eval_result,
                })

    return {"qa_pairs": qa_pairs, "evaluations": evaluations}
