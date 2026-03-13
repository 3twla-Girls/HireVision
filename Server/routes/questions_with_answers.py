# ============================================================================
# IMPORTS
# ============================================================================
import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from ..controllers.QuestionGeneration_controller import QuestionGenerationController
from ..controllers.JobController import JobController

logger = logging.getLogger("uvicorn.error")

# ============================================================================
# SCHEMAS (For Mock Request)
# ============================================================================
class MockInterviewRequest(BaseModel):
    candidate_id: str
    job_title: str
    skills: List[str]
    experience_level: Optional[str] = "Junior"
    num_questions: Optional[int] = 5

# ============================================================================
# ROUTER INITIALIZATION
# ============================================================================
router = APIRouter(
    prefix="/api/v1/questions",
    tags=["api_v1", "questions"],
)

# ============================================================================
# CREATE - Generate Interview Questions (Real Job)
# ============================================================================
@router.post("/generate-interview-questions/{job_id}")
async def generate_interview_questions(request: Request, job_id: str):
    try:
        controller = await QuestionGenerationController.create_instance(
            db_client=request.app.db_client
        )
        faiss_service_job = request.app.state.faiss_service["faiss_service_job"]
        job_controller = await JobController.create_instance(
            db_client=request.app.db_client,
            faiss_service_job=faiss_service_job
        )
        job_info = await job_controller.get_job(job_id=job_id)
        result = await controller.generate_and_store(job_info)
        
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=result)
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}")
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": str(e)})

# ============================================================================
# CREATE - Generate Mock Interview Questions (New Endpoint)
# ============================================================================
@router.post("/generate-mock-questions")
async def generate_mock_questions(request: Request, mock_data: MockInterviewRequest):
    try:
        controller = await QuestionGenerationController.create_instance(
            db_client=request.app.db_client
        )
        
        # constructing a mock job_info dict to pass to the existing generate_and_store method
        mock_job_info = {
            "job_id": mock_data.candidate_id, # using candidate_id as a placeholder for job_id since it's required by the method
            "job_title": mock_data.job_title,
            "skills": mock_data.skills,
            "experience_level": mock_data.experience_level,
            "num_questions": mock_data.num_questions,
            "is_mock": True
        }

        result = await controller.generate_and_store(mock_job_info)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=result
        )
    except Exception as e:
        logger.error(f"Error generating mock interview questions: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )