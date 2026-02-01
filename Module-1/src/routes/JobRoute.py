from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
import logging

from helpers.config import get_settings, Settings
from controllers.JobController import JobController
from models import ProjectModel, JobScheme

logger = logging.getLogger('uvicorn.error')

job_router = APIRouter(
    prefix="/api/v1/job",
    tags=["api_v1", "job"],
)

# =============================
# create Job under a Project
# =============================
@job_router.post("/create/{project_id}")
async def create_job(request: Request, project_id: str, job: JobScheme,
                    app_settings: Settings = Depends(get_settings)):

    job_controller = await JobController.create_instance(
        db_client=request.app.db_client
    )

    try:
        job_record = await job_controller.create_job(
            project_id=project_id,
            job_data=job
        )
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "signal": "JOB_CREATED_SUCCESSFULLY",
                "job_id": str(job_record.inserted_id)
            }
        )

    except Exception as e:
        logger.error(f"Error creating job: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_CREATION_FAILED"}
        )

# =============================
# get all Jobs by Project ID
# =============================
@job_router.get("/all/{project_id}")
async def get_jobs(request: Request, project_id: str):
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client
    )

    try:
        jobs = await job_controller.get_jobs_by_project(project_id=project_id)
        return JSONResponse(content={"jobs": jobs})

    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_FETCH_FAILED"}
        )

# =============================
# get Job by ID
# =============================
@job_router.get("/{job_id}")
async def get_job(request: Request, job_id: str):
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client
    )

    try:
        job = await job_controller.get_job(job_id=job_id)
        return JSONResponse(content={"job": job})

    except Exception as e:
        logger.error(f"Error fetching job: {e}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": "JOB_NOT_FOUND"}
        )

# =============================
# Update Job
# =============================
@job_router.patch("/{job_id}")
async def update_job(request: Request, job_id: str, job: JobScheme):
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client
    )

    try:
        updated_job = await job_controller.update_job(
            job_id=job_id,
            job_data=job
        )
        return JSONResponse(content={"job": updated_job})

    except Exception as e:
        logger.error(f"Error updating job: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_UPDATE_FAILED"}
        )

# =============================
# Delete Job
# =============================
@job_router.delete("/{job_id}")
async def delete_job(request: Request, job_id: str):
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client
    )

    try:
        await job_controller.delete_job(job_id=job_id)
        return JSONResponse(content={"signal": "JOB_DELETED_SUCCESSFULLY"})

    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_DELETE_FAILED"}
        )

# Get job's rankings
@job_router.get("/{job_id}/rankings")
async def get_job_rankings(request: Request, job_id: str):
    job_controller = await JobController.create_instance(request.app.db_client)
    try:
        embedder = request.app.state.embedder
        config = request.app.state.config
        rankings = await job_controller.get_rankings(job_id, embedder, config)
        return {"rankings": rankings}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})