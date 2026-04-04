# ============================================================================
# IMPORTS
# ============================================================================
import logging
from fastapi import APIRouter, Request, status, UploadFile, File
from fastapi.responses import JSONResponse
from Server.controllers.ApplicationController import ApplicationController
from bson.errors import InvalidId
from fastapi.encoders import jsonable_encoder
from ..controllers.Interview_controller import InterviewController

logger = logging.getLogger("uvicorn.error")


# ============================================================================
# ROUTER INITIALIZATION
# ============================================================================
interview_router = APIRouter(
    prefix="/api/v1/interview",
    tags=["api_v1", "interview"],
)


# ============================================================================
# CREATE - Interview Session
# ============================================================================
@interview_router.post("/start-session/{applicant_id}")
async def start_session(request: Request, applicant_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )
        app_controller = await ApplicationController.create_instance(
        request.app.db_client
        )
        application = await app_controller.get_application_by_id(applicant_id)
        result = await controller.start_session(application.candidate_id, application.job_id, False)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=result
        )
    except Exception as e:
        logger.error(f"Error starting interview session: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ============================================================================
# CREATE - Mock Interview Session
# ============================================================================
@interview_router.post("/start-mock-session/{candidate_id}")
async def start_mock_session(request: Request, candidate_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )

        body = await request.json()
        job_title = body.get("job_title", None)

        result = await controller.start_session(candidate_id, None, True, job_title=job_title)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=result
        )
    except Exception as e:
        logger.error(f"Error starting mock interview session: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ============================================================================
# READ - Questions
# ============================================================================
@interview_router.get("/questions/{job_id}")
async def get_questions(request: Request, job_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )
        result = await controller.get_questions(job_id)
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    except Exception as e:
        logger.error(f"Error retrieving questions: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ============================================================================
# READ - Session
# ============================================================================
@interview_router.get("/session/{session_id}")
async def get_session(request: Request, session_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )

        result = await controller.get_session(session_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(result)
        )

    except Exception as e:
        logger.error(f"Error retrieving session: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


@interview_router.get("/candidate/{candidate_id}")
async def get_candidate_sessions(request: Request, candidate_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )
        result = await controller.get_sessions_by_candidate(candidate_id)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(result)
        )
    except Exception as e:
        logger.error(f"Error retrieving candidate sessions: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )



# ============================================================================
# UPDATE - Submit Answer
# ============================================================================
"""@interview_router.post("/submit-answer")
async def submit_answer(
    request: Request,
    session_id: str,
    question_id: str,
    file: UploadFile = File(...)
):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )
        result = await controller.submit_answer(session_id, question_id, file)
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )"""
@interview_router.post("/submit-answer")
async def submit_candidate_answer(
    request: Request,
    session_id: str,
    question_id: str,
    selected_option: str = None,
    file: UploadFile = File(None)
):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )

        result = await controller.submit_answer_unified(
            session_id=session_id,
            question_id=question_id,
            file=file,
            selected_option=selected_option
        )

        return JSONResponse(status_code=200, content=result)

    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
# ============================================================================
# UPDATE - Generate Summary
# ============================================================================
@interview_router.post("/final-summary/{session_id}")
async def generate_summary(request: Request, session_id: str):
    try:
        controller = await InterviewController.create_instance(
            request.app.db_client
        )
        result = await controller.generate_summary(session_id)
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )