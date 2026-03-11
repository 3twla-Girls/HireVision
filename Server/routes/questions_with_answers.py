from fastapi import APIRouter
from Server.controllers.QuestionGeneration_controller import generate_and_store

router = APIRouter()

@router.post("/generate-interview-questions")
async def generate_interview(job_info: dict):
    result = await generate_and_store(job_info)
    return result