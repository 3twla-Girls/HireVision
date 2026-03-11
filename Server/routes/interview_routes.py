from fastapi import APIRouter
from Server.controllers import Interview_controller as controller

router = APIRouter()


@router.post("/start-session")
def start_session(candidate_id: str, job_id: str):
    return controller.start_session(candidate_id, job_id)


@router.get("/questions/{job_id}")
def get_questions(job_id: str):
    return controller.get_questions(job_id)


@router.post("/submit-answer")
def submit_answer(session_id: str, question_id: str, speech_to_text: str):
    return controller.submit_answer(session_id, question_id, speech_to_text)


@router.post("/final-summary")
def final_summary(session_id: str):
    return controller.generate_summary(session_id)


@router.get("/session/{session_id}")
def get_session(session_id: str):
    return controller.get_session(session_id)