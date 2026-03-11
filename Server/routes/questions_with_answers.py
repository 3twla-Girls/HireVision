# ============================================================================
# IMPORTS
# ============================================================================
import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from ..controllers.QuestionGeneration_controller import QuestionGenerationController
from ..controllers.JobController import JobController
logger = logging.getLogger("uvicorn.error")


# ============================================================================
# ROUTER INITIALIZATION
# ============================================================================
router = APIRouter(
    prefix="/api/v1/questions",
    tags=["api_v1", "questions"],
)


# ============================================================================
# CREATE - Generate Interview Questions
# ============================================================================
@router.post("/generate-interview-questions/{job_id}")
async def generate_interview_questions(request: Request, job_id: str):
    try:
        # Initialize the controller instance
        controller = await QuestionGenerationController.create_instance(
            db_client=request.app.db_client
        )
        # get job by id
        faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
        job_controller = await JobController.create_instance(
            db_client=request.app.db_client,
            faiss_service_job=faiss_service_job
        )
        job_info = await job_controller.get_job(job_id=job_id)
        # Call the method
        result = await controller.generate_and_store(job_info)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=result
        )
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )
