"""
Hiring Automation Service
==========================
This module is the public entry-point called from:
  - JobRoute.py (PATCH /{job_id}/status   → background_tasks.add_task)
  - JobRoute.py (POST  /{job_id}/trigger-pipeline → admin endpoint)
  - expiry_scheduler.py (APScheduler hourly job)

All heavy logic lives in the pipeline package under helpers/pipeline/.
This file is intentionally thin — it just sets up context and delegates.

Email dispatch
--------------
After the pipeline selects top candidates (status → accepted_for_interview),
this service automatically sends interview invitation emails to all of them
via EmailController.bulk_send_invitations().

The recruiter_id is read from the job document (field: recruiter_id).
The interview_date defaults to a placeholder that the recruiter can later
override by re-sending via the /email/bulk-invite endpoint manually.
"""
import logging
from .pipeline import run_pipeline

logger = logging.getLogger(__name__)

# Placeholder interview date injected into the automated email.
# Candidates are told the recruiter will confirm the exact time — this keeps
# the invitation useful without blocking on a specific date being pre-set.
_DEFAULT_INTERVIEW_DATE = "To be confirmed by the recruiter — watch your email for details"

_DEFAULT_EXTRA_NOTES = (
    "This invitation was sent automatically after the job posting closed. "
    "Your recruiter will follow up with a confirmed date and link shortly."
)


async def run_hiring_automation(job_data: dict, app, force: bool = False) -> dict:
    """
    Orchestrates the full ranking → selection → scheduling pipeline
    for a job that has just moved to 'closed' or 'expired'.

    After the pipeline succeeds, sends interview invitation emails to every
    candidate whose session was accepted_for_interview by the pipeline.

    Args:
        job_data:  Raw MongoDB document for the job (dict with _id, etc.)
        app:       FastAPI application instance (exposes app.db_client).
        force:     Bypass the idempotency guard if True.

    Returns:
        The pipeline result summary dict produced by orchestrator.run_pipeline(),
        augmented with an "email_dispatch" key containing the email results.
    """
    job_id = str(job_data.get("_id", "unknown"))
    logger.info(f"[Automation] Delegating to pipeline for job {job_id}")

    try:
        result = await run_pipeline(job_data, app, force=force)

        if not result.get("success"):
            logger.error(f"[Automation] Pipeline reported failure for job {job_id}: {result}")
            return result

        logger.info(f"[Automation] Pipeline succeeded for job {job_id}")

        # ── Auto-email accepted candidates ──────────────────────────────
        email_result = await _dispatch_invitations(job_data, result, app)
        result["email_dispatch"] = email_result

        return result

    except Exception as e:
        logger.error(
            f"[Automation] Unhandled exception for job {job_id}: {e}",
            exc_info=True
        )
        return {"job_id": job_id, "success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# PRIVATE — email dispatch helper
# ---------------------------------------------------------------------------

async def _dispatch_invitations(job_data: dict, pipeline_result: dict, app) -> dict:
    """
    Reads the list of accepted session IDs from the pipeline result and sends
    interview invitation emails to all of them.

    The pipeline result is expected to contain one of:
      - pipeline_result["accepted_sessions"]  → list[str]   (preferred)
      - pipeline_result["session_ids"]         → list[str]
      - pipeline_result["shortlisted"]         → list[str]

    If none of those keys are present the function falls back to querying
    MongoDB directly for sessions belonging to this job with status
    'accepted_for_interview'.

    Returns a dict with sent/failed counts (never raises).
    """
    from ..controllers.EmailController import EmailController
    from bson import ObjectId

    job_id      = str(job_data.get("_id", ""))
    recruiter_id = str(job_data.get("recruiter_id", ""))

    # ── 1. Resolve session IDs ───────────────────────────────────────────
    session_ids: list[str] = (
        pipeline_result.get("accepted_sessions")
        or pipeline_result.get("session_ids")
        or pipeline_result.get("shortlisted")
        or []
    )

    if not session_ids:
        # Fallback: query DB for accepted sessions directly
        session_ids = await _fetch_accepted_sessions(app.db_client, job_id)

    if not session_ids:
        logger.warning(
            f"[Automation] No accepted sessions found for job {job_id} — skipping emails."
        )
        return {"sent": 0, "failed": 0, "skipped": True}

    if not recruiter_id:
        logger.warning(
            f"[Automation] Job {job_id} has no recruiter_id — cannot send emails."
        )
        return {"sent": 0, "failed": 0, "skipped": True, "reason": "missing recruiter_id"}

    # ── 2. Send bulk invitations ─────────────────────────────────────────
    try:
        controller = await EmailController.create_instance(app.db_client)

        bulk_result = await controller.bulk_send_invitations(
            session_ids    = session_ids,
            recruiter_id   = recruiter_id,
            interview_date = _DEFAULT_INTERVIEW_DATE,
            interview_link = "",               # recruiter sets this later via the UI
            extra_notes    = _DEFAULT_EXTRA_NOTES,
        )

        sent_count   = len(bulk_result.get("sent", []))
        failed_count = len(bulk_result.get("failed", []))

        logger.info(
            f"[Automation] Email dispatch complete for job {job_id} — "
            f"sent:{sent_count}  failed:{failed_count}"
        )

        return {
            "sent":         sent_count,
            "failed":       failed_count,
            "sent_ids":     bulk_result.get("sent", []),
            "failed_ids":   bulk_result.get("failed", []),
        }

    except Exception as e:
        logger.error(
            f"[Automation] Email dispatch failed for job {job_id}: {e}",
            exc_info=True
        )
        return {"sent": 0, "failed": len(session_ids), "error": str(e)}


async def _fetch_accepted_sessions(db_client, job_id: str) -> list[str]:
    """
    Fallback: query the interview_sessions collection for all sessions
    linked to this job whose status is 'accepted_for_interview'.
    """
    from ..models.enums.DataBaseEnum import DataBaseEnum
    from bson import ObjectId

    try:
        collection = db_client[DataBaseEnum.COLLECTION_APPLICATION_NAME.value]
        cursor = collection.find(
            {
                "job_id": ObjectId(job_id),
                "status": "accepted_for_interview",
            },
            {"_id": 1}
        )
        docs = await cursor.to_list(length=None)
        ids  = [str(doc["_id"]) for doc in docs]
        logger.info(
            f"[Automation] DB fallback found {len(ids)} accepted sessions for job {job_id}"
        )
        return ids

    except Exception as e:
        logger.error(f"[Automation] _fetch_accepted_sessions failed: {e}")
        return []
