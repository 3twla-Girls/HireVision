from fastapi import APIRouter
from controllers.QuestionGeneration_controller import generate_questions_service
from models.job_info import JobInfo
import models.model_factory as model_factory


router = APIRouter()
@router.post("/generate-questions")
async def generate_questions(job_info: JobInfo):
    result = generate_questions_service(
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )

    return {"questions": result}
