from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict
import uuid
import os
import shutil

from Question_Generation.controllers.QuestionGeneration_controller import generate_questions_service
from Question_Generation.controllers.AnswerGeneration_controller import generate_answers_service
from Question_Generation.models.model_factory import ModelFactory
from STT.services.audio_service import full_transcription_pipeline
from Answer_Evaluation.evaluator import evaluate_single_answer, generate_final_summary

router = APIRouter(prefix="/interview")

# -----------------------------
# Memory store for sessions
# -----------------------------
ACTIVE_SESSIONS: Dict[str, Dict] = {}

# -----------------------------
# Stage 1: Generate Questions
# -----------------------------
@router.post("/start", tags=["1. Start/QG"])
async def start_interview(job_info: dict):
    """
    Generate questions and reference answers.
    Returns session_id and questions.
    """
    session_id = str(uuid.uuid4())

    # Generate Questions
    questions_data = generate_questions_service(
        job_title=job_info["job_title"],
        skills=job_info["skills"],
        experience_level=job_info["experience_level"],
        num_questions=job_info["num_questions"],
        model_key=ModelFactory.active_model_key
    )

    if 'questions' not in questions_data or not questions_data['questions']:
        raise HTTPException(status_code=500, detail=f"Question Generation failed: {questions_data.get('error','Unknown Error')}")

    # Generate Reference Answers
    question_list_str = "\n".join([q['question'] for q in questions_data['questions']])
    ref_answers_data = generate_answers_service(
        job_title=job_info["job_title"],
        skills=job_info["skills"],
        experience_level=job_info["experience_level"],
        questions=question_list_str,
        model_key=ModelFactory.active_model_key
    )

    # Combine questions and reference answers
    session_questions = []
    for i, q_item in enumerate(questions_data['questions']):
        reference_answer_text = ref_answers_data['answers'][i].get('reference_answer')
        session_questions.append({
            "question_id": str(i + 1),
            "question": q_item['question'],
            "options": q_item.get('options', []),
            "reference_answer": reference_answer_text
        })

    # Save session
    ACTIVE_SESSIONS[session_id] = {
        "job_info": job_info,
        "questions": session_questions,
        "evaluations": []
    }

    return {
        "session_id": session_id,
        "questions": session_questions
    }

# -----------------------------
# Stage 2: Submit Answer per Question
# -----------------------------
@router.post("/submit-answer/{session_id}/{question_id}", tags=["2. STT & Eval"])
async def submit_answer(session_id: str, question_id: str, file: UploadFile = File(...)):
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    session = ACTIVE_SESSIONS[session_id]
    question_obj = next((q for q in session["questions"] if q["question_id"] == question_id), None)
    if not question_obj:
        raise HTTPException(status_code=404, detail="Question not found")

    # Save audio temporarily
    os.makedirs("temp_answers", exist_ok=True)
    temp_path = f"temp_answers/{file.filename}"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Transcribe
    transcription = full_transcription_pipeline(temp_path)
    os.remove(temp_path)

    # Evaluate
    evaluation_result = evaluate_single_answer(
        question=question_obj["question"],
        correct_answer=question_obj["reference_answer"],
        candidate_answer=transcription
    )

    # Store evaluation
    session["evaluations"].append({
        "question_id": question_id,
        "question": question_obj["question"],
        "reference_answer": question_obj["reference_answer"],
        "candidate_answer": transcription,
        "evaluation": evaluation_result
    })

    return {
        "transcription": transcription,
        "evaluation": evaluation_result
    }

# -----------------------------
# Stage 3: Final Overall Summary
# -----------------------------
@router.post("/finish/{session_id}", tags=["3. Final Summary"])
async def finish_interview(session_id: str):
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    session = ACTIVE_SESSIONS[session_id]
    evaluations = session.get("evaluations", [])
    if not evaluations:
        raise HTTPException(status_code=400, detail="No answers submitted")

    # Generate overall feedback
    final_feedback = generate_final_summary(evaluations)

    return {
        "session_id": session_id,
        "questions_answered": len(evaluations),
        "evaluations": evaluations,
        "final_feedback": final_feedback
    }
