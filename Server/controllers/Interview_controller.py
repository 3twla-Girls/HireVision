from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile, File

from Server.config.database import db

# Import Module 3 logic
from Module_3.STT.controllers.stt_controller import transcribe_video 
from Module_3.Answer_Evaluation.evaluator import (
    evaluate_single_answer,
    generate_final_summary
)


sessions_collection = db["interview_sessions"]
questions_collection = db["questions_with_answers"]


def start_session(candidate_id: str, job_id: str):

    session = {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "session_date": datetime.utcnow(),
        "answers": [],
        "final_summary": None
    }

    result = sessions_collection.insert_one(session)

    return {
        "status": "session_started",
        "session_id": str(result.inserted_id)
    }


def get_questions(job_id: str):

    job_questions = questions_collection.find_one(
        {"job_id": ObjectId(job_id)}
    )

    if not job_questions:
        return {"error": "No questions found for this job"}

    questions = job_questions["questions_w_answers"]

    # convert ids to string
    for q in questions:
        q["question_id"] = str(q["question_id"])

    return {
        "job_id": job_id,
        "questions": questions
    }


async def submit_answer(session_id: str, question_id: str, file: UploadFile = File(...)):

    # Step 1: convert video → text using STT service
    speech_to_text = transcribe_video(file)

    # Step 2: get question from DB
    job_questions = questions_collection.find_one({
        "questions_w_answers.question_id": ObjectId(question_id)
    })

    if not job_questions:
        return {"error": "Question not found"}

    question_data = None

    for q in job_questions["questions_w_answers"]:
        if q["question_id"] == ObjectId(question_id):
            question_data = q
            break

    if not question_data:
        return {"error": "Question not found"}

    question_text = question_data["question"]
    correct_answer = question_data["reference_answer"]

    # Step 3: evaluate answer
    evaluation = evaluate_single_answer(
        question_text,
        correct_answer,
        speech_to_text
    )

    # Step 4: save in DB
    answer_doc = {
        "question_id": ObjectId(question_id),
        "speech_to_text": speech_to_text,
        "evaluation": evaluation
    }

    sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"answers": answer_doc}}
    )

    return {
        "status": "answer_saved",
        "transcription": speech_to_text,
        "evaluation": evaluation
    }


def generate_summary(session_id: str):

    session = sessions_collection.find_one({"_id": ObjectId(session_id)})

    if not session:
        return {"error": "Session not found"}

    evaluations = [
        ans["evaluation"]
        for ans in session["answers"]
        if "evaluation" in ans
    ]

    summary = generate_final_summary(evaluations)

    sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"final_summary": summary}}
    )

    return {
        "status": "summary_generated",
        "summary": summary
    }


def get_session(session_id: str):

    session = sessions_collection.find_one({"_id": ObjectId(session_id)})

    if not session:
        return {"error": "Session not found"}

    session["_id"] = str(session["_id"])

    for ans in session["answers"]:
        ans["question_id"] = str(ans["question_id"])

    return session