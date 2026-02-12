"""
Audit endpoints — calls the other Module-3 services via HTTP,
then uses LLM-as-a-Judge to score their responses.
"""

import time
import httpx
from fastapi import APIRouter

import judge
from models import (
    AuditRequest,
    QuestionScore, AnswerScore, EvaluationScore,
    QuestionsAuditResponse, AnswersAuditResponse,
    EvaluationAuditResponse, FullAuditResponse,
    QuestionsSummary, AnswersSummary, EvaluationSummary,
)

router = APIRouter()

# ── Service URLs (the other Module-3 services) ───────────────
QUESTION_SERVICE_URL = "http://localhost:8000"
EVALUATION_SERVICE_URL = "http://localhost:8001"


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/questions", response_model=QuestionsAuditResponse)
async def audit_questions(req: AuditRequest):
    """
    Calls the Question-Generation service, then judges each question.
    """
    start = time.time()

    # 1. Call Question-Generation API
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions",
            json={
                "job_title": req.job_title,
                "skills": req.skills,
                "experience_level": req.experience_level,
                "num_questions": req.num_questions,
            },
        )
    api_response = response.json()
    questions = api_response.get("questions", [])

    # 2. Judge each question
    scores = []
    for q in questions:
        result = judge.judge_question(
            question=q["question"],
            job_title=req.job_title,
            skills=req.skills,
            experience_level=req.experience_level,
        )
        scores.append(QuestionScore(
            question=q["question"],
            relevance=float(result.get("relevance", 0)),
            clarity=float(result.get("clarity", 0)),
            difficulty_calibration=float(result.get("difficulty_calibration", 0)),
            reasoning=result.get("reasoning", ""),
        ))

    avg_rel = sum(s.relevance for s in scores) / len(scores) if scores else 0
    avg_cla = sum(s.clarity for s in scores) / len(scores) if scores else 0
    avg_dif = sum(s.difficulty_calibration for s in scores) / len(scores) if scores else 0
    overall = round((avg_rel + avg_cla + avg_dif) / 3, 2)

    return QuestionsAuditResponse(
        per_question_scores=scores,
        average_relevance=round(avg_rel, 2),
        average_clarity=round(avg_cla, 2),
        average_difficulty_calibration=round(avg_dif, 2),
        overall_score=overall,
        latency_ms=round((time.time() - start) * 1000, 2),
    )


@router.post("/answers", response_model=AnswersAuditResponse)
async def audit_answers(req: AuditRequest):
    """
    Calls the Question-Generation service (with answers), then judges each answer.
    """
    start = time.time()

    # 1. Call Question-Generation API to get questions + reference answers
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions-with-answers",
            json={
                "job_title": req.job_title,
                "skills": req.skills,
                "experience_level": req.experience_level,
                "num_questions": req.num_questions,
            },
        )
    api_response = response.json()
    qa_pairs = api_response.get("questions_with_answers", [])

    # 2. Judge each reference answer
    scores = []
    for item in qa_pairs:
        question_type = item.get("question_type", "conceptual")
        options = item.get("options", [])

        result = judge.judge_answer(
            question=item["question"],
            reference_answer=item.get("reference_answer") or "",
            job_title=req.job_title,
            skills=req.skills,
            experience_level=req.experience_level,
            question_type=question_type,
            options=options,
        )
        scores.append(AnswerScore(
            question=item["question"],
            reference_answer=item.get("reference_answer") or "",
            correctness=float(result.get("correctness", 0)),
            completeness=float(result.get("completeness", 0)),
            question_alignment=float(result.get("question_alignment", 0)),
            reasoning=result.get("reasoning", ""),
        ))

    avg_cor = sum(s.correctness for s in scores) / len(scores) if scores else 0
    avg_com = sum(s.completeness for s in scores) / len(scores) if scores else 0
    avg_ali = sum(s.question_alignment for s in scores) / len(scores) if scores else 0
    overall = round((avg_cor + avg_com + avg_ali) / 3, 2)

    return AnswersAuditResponse(
        per_answer_scores=scores,
        average_correctness=round(avg_cor, 2),
        average_completeness=round(avg_com, 2),
        average_alignment=round(avg_ali, 2),
        overall_score=overall,
        latency_ms=round((time.time() - start) * 1000, 2),
    )


@router.post("/evaluation", response_model=EvaluationAuditResponse)
async def audit_evaluation(req: AuditRequest):
    """
    Full cycle: 
      1. Call Question-Generation to get questions + reference answers
      2. Call Answer-Evaluation to evaluate (using reference as candidate)
      3. Judge the evaluation for fairness
    """
    start = time.time()

    # 1. Get questions + reference answers from Question-Generation API
    async with httpx.AsyncClient(timeout=60.0) as client:
        qg_response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions-with-answers",
            json={
                "job_title": req.job_title,
                "skills": req.skills,
                "experience_level": req.experience_level,
                "num_questions": req.num_questions,
            },
        )
    qa_pairs = qg_response.json().get("questions_with_answers", [])

    # 2. For each Q&A, simulate a candidate answer, evaluate it, then judge
    scores = []
    async with httpx.AsyncClient(timeout=60.0) as client:
        for item in qa_pairs:
            reference = item.get("reference_answer") or ""

            # Simulate a realistic candidate answer (instead of using reference)
            candidate = judge.simulate_candidate_answer(
                question=item["question"],
                job_title=req.job_title,
                experience_level=req.experience_level,
            )

            # Call Answer-Evaluation API
            eval_response = await client.post(
                f"{EVALUATION_SERVICE_URL}/api/answer-evaluation",
                json={
                    "question": item["question"],
                    "correct_answer": reference,
                    "candidate_answer": candidate,
                },
            )
            eval_result = eval_response.json()

            if "error" in eval_result:
                continue

            # 3. Judge the evaluation
            judge_result = judge.judge_evaluation(
                question=item["question"],
                reference_answer=reference,
                candidate_answer=candidate,
                evaluation=eval_result,
            )

            original_score = eval_result.get("score", 0)
            try:
                original_score = float(str(original_score).split("-")[0])
            except (ValueError, IndexError):
                original_score = 0.0

            scores.append(EvaluationScore(
                question=item["question"],
                candidate_answer=candidate,
                original_score=original_score,
                judge_score=float(judge_result.get("judge_score", 0)),
                faithfulness=float(judge_result.get("faithfulness", 0)),
                bias_detected=bool(judge_result.get("bias_detected", False)),
                reasoning=judge_result.get("reasoning", ""),
            ))

    avg_faith = sum(s.faithfulness for s in scores) / len(scores) if scores else 0
    avg_judge = sum(s.judge_score for s in scores) / len(scores) if scores else 0
    bias_count = sum(1 for s in scores if s.bias_detected)
    overall = round((avg_faith + avg_judge) / 2, 2)

    return EvaluationAuditResponse(
        per_evaluation_scores=scores,
        average_faithfulness=round(avg_faith, 2),
        average_judge_score=round(avg_judge, 2),
        bias_count=bias_count,
        overall_score=overall,
        latency_ms=round((time.time() - start) * 1000, 2),
    )


@router.post("/full", response_model=FullAuditResponse)
async def audit_full(req: AuditRequest):
    """
    Single connected pipeline audit:
      1. Generate questions (Question-Gen API)
      2. Generate answers for those SAME questions (Question-Gen API)
      3. Simulate candidate answers
      4. Evaluate candidates (Answer-Evaluation API)
      5. Judge every stage + overall quality
    """

    async with httpx.AsyncClient(timeout=120.0) as client:

        # ── Step 1: Generate questions ────────────────────────
        qg_response = await client.post(
            f"{QUESTION_SERVICE_URL}/generate-questions-with-answers",
            json={
                "job_title": req.job_title,
                "skills": req.skills,
                "experience_level": req.experience_level,
                "num_questions": req.num_questions,
            },
        )
        qa_pairs = qg_response.json().get("questions_with_answers", [])

        # ── Step 2: Judge each question ───────────────────────
        q_scores = []
        for item in qa_pairs:
            result = judge.judge_question(
                question=item["question"],
                job_title=req.job_title,
                skills=req.skills,
                experience_level=req.experience_level,
            )
            q_scores.append(QuestionScore(
                question=item["question"],
                relevance=float(result.get("relevance", 0)),
                clarity=float(result.get("clarity", 0)),
                difficulty_calibration=float(result.get("difficulty_calibration", 0)),
                reasoning=result.get("reasoning", ""),
            ))

        # ── Step 3: Judge each reference answer ──────────────
        a_scores = []
        for item in qa_pairs:
            question_type = item.get("question_type", "conceptual")
            options = item.get("options", [])
            ref_answer = item.get("reference_answer") or ""

            result = judge.judge_answer(
                question=item["question"],
                reference_answer=ref_answer,
                job_title=req.job_title,
                skills=req.skills,
                experience_level=req.experience_level,
                question_type=question_type,
                options=options,
            )
            a_scores.append(AnswerScore(
                question=item["question"],
                reference_answer=ref_answer,
                correctness=float(result.get("correctness", 0)),
                completeness=float(result.get("completeness", 0)),
                question_alignment=float(result.get("question_alignment", 0)),
                reasoning=result.get("reasoning", ""),
            ))

        # ── Step 4: Simulate candidates + evaluate + judge ───
        e_scores = []
        for item in qa_pairs:
            reference = item.get("reference_answer") or ""

            # Simulate a realistic candidate answer
            candidate = judge.simulate_candidate_answer(
                question=item["question"],
                job_title=req.job_title,
                experience_level=req.experience_level,
            )

            # Call Answer-Evaluation API
            eval_response = await client.post(
                f"{EVALUATION_SERVICE_URL}/api/answer-evaluation",
                json={
                    "question": item["question"],
                    "correct_answer": reference,
                    "candidate_answer": candidate,
                },
            )
            eval_result = eval_response.json()

            if "error" in eval_result:
                continue

            # Judge the evaluation
            judge_result = judge.judge_evaluation(
                question=item["question"],
                reference_answer=reference,
                candidate_answer=candidate,
                evaluation=eval_result,
            )

            original_score = eval_result.get("score", 0)
            try:
                original_score = float(str(original_score).split("-")[0])
            except (ValueError, IndexError):
                original_score = 0.0

            e_scores.append(EvaluationScore(
                question=item["question"],
                candidate_answer=candidate,
                original_score=original_score,
                judge_score=float(judge_result.get("judge_score", 0)),
                faithfulness=float(judge_result.get("faithfulness", 0)),
                bias_detected=bool(judge_result.get("bias_detected", False)),
                reasoning=judge_result.get("reasoning", ""),
            ))

    # ── Compute averages ──────────────────────────────────────
    avg_rel = sum(s.relevance for s in q_scores) / len(q_scores) if q_scores else 0
    avg_cla = sum(s.clarity for s in q_scores) / len(q_scores) if q_scores else 0
    avg_dif = sum(s.difficulty_calibration for s in q_scores) / len(q_scores) if q_scores else 0
    q_overall = round((avg_rel + avg_cla + avg_dif) / 3, 2)

    avg_cor = sum(s.correctness for s in a_scores) / len(a_scores) if a_scores else 0
    avg_com = sum(s.completeness for s in a_scores) / len(a_scores) if a_scores else 0
    avg_ali = sum(s.question_alignment for s in a_scores) / len(a_scores) if a_scores else 0
    a_overall = round((avg_cor + avg_com + avg_ali) / 3, 2)

    avg_faith = sum(s.faithfulness for s in e_scores) / len(e_scores) if e_scores else 0
    avg_judge = sum(s.judge_score for s in e_scores) / len(e_scores) if e_scores else 0
    bias_count = sum(1 for s in e_scores if s.bias_detected)
    e_overall = round((avg_faith + avg_judge) / 2, 2)

    # ── Step 5: Judge overall system quality ──────────────────
    questions_text = "\n".join(f"- {s.question}" for s in q_scores)
    answers_text = "\n".join(
        f"- Q: {s.question}\n  A: {s.reference_answer}" for s in a_scores
    )
    evaluation_text = "\n".join(
        f"- Q: {s.question}\n  Candidate: {s.candidate_answer}\n  Score: {s.original_score}"
        for s in e_scores
    )

    overall_result = judge.judge_overall(
        questions_text=questions_text,
        answers_text=answers_text,
        evaluation_text=evaluation_text,
        job_title=req.job_title,
        skills=req.skills,
        experience_level=req.experience_level,
    )

    consistency = float(overall_result.get("consistency", 0))
    fluency = float(overall_result.get("fluency", 0))
    efficiency = float(overall_result.get("efficiency", 0))
    helpfulness = float(overall_result.get("helpfulness", 0))

    system_score = round(
        (q_overall + a_overall + e_overall
         + consistency + fluency + efficiency + helpfulness) / 7, 2
    )

    return FullAuditResponse(
        question_generation=QuestionsSummary(
            average_relevance=round(avg_rel, 2),
            average_clarity=round(avg_cla, 2),
            average_difficulty_calibration=round(avg_dif, 2),
            overall_score=q_overall,
        ),
        answer_generation=AnswersSummary(
            average_correctness=round(avg_cor, 2),
            average_completeness=round(avg_com, 2),
            average_alignment=round(avg_ali, 2),
            overall_score=a_overall,
        ),
        evaluation_fairness=EvaluationSummary(
            average_faithfulness=round(avg_faith, 2),
            average_judge_score=round(avg_judge, 2),
            bias_count=bias_count,
            overall_score=e_overall,
        ),
        consistency=consistency,
        fluency=fluency,
        efficiency=efficiency,
        helpfulness=helpfulness,
        overall_reasoning=overall_result.get("reasoning", ""),
        system_overall_score=system_score,
    )
