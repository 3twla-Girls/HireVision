from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
import logging
from bson.errors import InvalidId
from .schemes.appRequest import MatchingUpdateRequest
from ..controllers.ApplicationController import ApplicationController
from ..models.db_schemes.Application import Application
from ..models.enums.ApplicationEnum import ApplicationStatusEnum


logger = logging.getLogger("uvicorn.error")

application_router = APIRouter(
    prefix="/api/v1/application",
    tags=["api_v1", "application"],
)


# =====================================
# Create Application
# =====================================

@application_router.post("/create")
async def create_application(request: Request, application: Application):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        result = await controller.create_application(application)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "signal": "APPLICATION_CREATED_SUCCESSFULLY",
                "application_id": str(result.id)
            }
        )

    except Exception as e:
        logger.error(f"Error creating application: {e}")

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# =====================================
# Get Application By ID
# =====================================

@application_router.get("/{application_id}")
async def get_application(request: Request, application_id: str):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        application = await controller.get_application_by_id(application_id)

        return application

    except InvalidId:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "INVALID_APPLICATION_ID"}
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )


# =====================================
# Get Applications By Job
# =====================================

@application_router.get("/job/{job_id}")
async def get_applications_by_job(request: Request, job_id: str):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        applications = await controller.get_applications_by_job(job_id)

        return applications

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# =====================================
# Update Matching Result
# =====================================

@application_router.put("/{application_id}/matching")
async def update_matching_result(
    request: Request,
    application_id: str,
    body: MatchingUpdateRequest  # ✅ body model
):
    controller = await ApplicationController.create_instance(request.app.db_client)

    application = await controller.update_matching_result(
        application_id,
        body.score,
        body.matched_skills,
        body.missing_skills
    )

    return application

# =====================================
# Update Status (pending / accepted / rejected)
# =====================================

@application_router.patch("/{application_id}/status")
async def update_application_status(
    request: Request,
    application_id: str,
    status_value: ApplicationStatusEnum
):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        application = await controller.update_status(
            application_id,
            status_value
        )

        return application

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# =====================================
# Delete Application
# =====================================

@application_router.delete("/{application_id}")
async def delete_application(request: Request, application_id: str):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        await controller.delete_application(application_id)

        return JSONResponse(
            content={"signal": "APPLICATION_DELETED_SUCCESSFULLY"}
        )

    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "APPLICATION_DELETE_FAILED"}
        )
        
        
# =====================================
# Get Applications By Candidate
# =====================================

@application_router.get("/candidate/{candidate_id}")
async def get_applications_by_candidate(request: Request, candidate_id: str):

    controller = await ApplicationController.create_instance(
        request.app.db_client
    )

    try:
        applications = await controller.get_applications_by_candidate(candidate_id)

        return applications

    except InvalidId:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "INVALID_CANDIDATE_ID"}
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )