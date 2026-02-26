from fastapi import APIRouter
from Server.controllers.QuestionGeneration_controller import generate_and_store

router = APIRouter()

@router.post("/generate-interview-questions")
def generate_interview(job_info: dict):
    return generate_and_store(job_info)