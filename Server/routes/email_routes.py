import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from ..controllers.EmailController import EmailController

logger = logging.getLogger("uvicorn.error")

email_router = APIRouter(
    prefix="/api/v1/email",
    tags=["api_v1", "email"],
)


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class InterviewInvitationRequest(BaseModel):
    session_id:      str
    recruiter_id:    str
    interview_date:  str            # e.g. "2026-04-10 03:00 PM"
    interview_link:  Optional[str] = ""
    extra_notes:     Optional[str] = ""


class StatusUpdateRequest(BaseModel):
    candidate_id:         str
    job_id:               str
    recruiter_id:         str
    application_status:   str       # "shortlisted" | "accepted" | "rejected"
    custom_message:       Optional[str] = ""


class InterviewResultRequest(BaseModel):
    session_id:    str
    recruiter_id:  str
    next_steps:    Optional[str] = ""


class BulkInvitationRequest(BaseModel):
    session_ids:     List[str]
    recruiter_id:    str
    interview_date:  str
    interview_link:  Optional[str] = ""
    extra_notes:     Optional[str] = ""


# ============================================================================
# ROUTES
# ============================================================================

# ── 1. Send interview invitation to a single candidate ──────────────────────
@email_router.post("/send-invitation")
async def send_interview_invitation(
    request: Request,
    body: InterviewInvitationRequest
):
    """
    Recruiter invites a candidate to their interview session.
    Fetches all info (candidate email, job title, company) from the DB
    automatically using the session_id.
    """
    try:
        controller = await EmailController.create_instance(request.app.db_client)

        result = await controller.send_interview_invitation(
            session_id      = body.session_id,
            recruiter_id    = body.recruiter_id,
            interview_date  = body.interview_date,
            interview_link  = body.interview_link,
            extra_notes     = body.extra_notes,
        )

        if result["status"] == "sent":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"signal": "EMAIL_SENT_SUCCESSFULLY", **result}
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_502_BAD_GATEWAY,
                content={"signal": "EMAIL_SEND_FAILED", **result}
            )

    except Exception as e:
        logger.error(f"Error sending invitation: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# ── 2. Send application status update ───────────────────────────────────────
@email_router.post("/send-status-update")
async def send_status_update(
    request: Request,
    body: StatusUpdateRequest
):
    """
    Notify a candidate that their application status has changed
    (shortlisted / accepted / rejected).
    """
    try:
        controller = await EmailController.create_instance(request.app.db_client)

        result = await controller.send_status_update(
            candidate_id        = body.candidate_id,
            job_id              = body.job_id,
            recruiter_id        = body.recruiter_id,
            application_status  = body.application_status,
            custom_message      = body.custom_message,
        )

        if result["status"] == "sent":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"signal": "EMAIL_SENT_SUCCESSFULLY", **result}
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_502_BAD_GATEWAY,
                content={"signal": "EMAIL_SEND_FAILED", **result}
            )

    except Exception as e:
        logger.error(f"Error sending status update: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# ── 3. Send interview result to candidate ───────────────────────────────────
@email_router.post("/send-result")
async def send_interview_result(
    request: Request,
    body: InterviewResultRequest
):
    """
    After the final summary is generated, the recruiter sends the
    candidate their technical score and next steps.
    Reads the score directly from the session's final_summary in the DB.
    """
    try:
        controller = await EmailController.create_instance(request.app.db_client)

        result = await controller.send_interview_result(
            session_id   = body.session_id,
            recruiter_id = body.recruiter_id,
            next_steps   = body.next_steps,
        )

        if result["status"] == "sent":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"signal": "EMAIL_SENT_SUCCESSFULLY", **result}
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_502_BAD_GATEWAY,
                content={"signal": "EMAIL_SEND_FAILED", **result}
            )

    except Exception as e:
        logger.error(f"Error sending interview result: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )


# ── 4. Bulk invite shortlisted candidates ───────────────────────────────────
@email_router.post("/bulk-invite")
async def bulk_send_invitations(
    request: Request,
    body: BulkInvitationRequest
):
    """
    Send interview invitations to multiple candidates at once.
    Useful after the ranking/shortlisting pipeline completes.
    Returns a breakdown of sent vs failed per session.
    """
    try:
        controller = await EmailController.create_instance(request.app.db_client)

        result = await controller.bulk_send_invitations(
            session_ids    = body.session_ids,
            recruiter_id   = body.recruiter_id,
            interview_date = body.interview_date,
            interview_link = body.interview_link,
            extra_notes    = body.extra_notes,
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "signal":       "BULK_INVITE_COMPLETE",
                "sent_count":   len(result["sent"]),
                "failed_count": len(result["failed"]),
                **result
            }
        )

    except Exception as e:
        logger.error(f"Error in bulk invite: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )
