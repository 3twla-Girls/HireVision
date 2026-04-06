"""
Step 4 – Mark Accepted & Rejected
=====================================
Performs two bulk DB operations in one step:
  1. Mark shortlisted application IDs as `accepted_for_interview`
  2. Mark the remaining applications for the job as `rejected`

This is idempotent: if an application is already `accepted_for_interview`
or `accepted`, the bulk_reject_except() filter skips it.
"""
import logging
from ...controllers.ApplicationController import ApplicationController
from ...models.enums.ApplicationEnum import ApplicationStatusEnum

logger = logging.getLogger(__name__)


async def mark_candidates(
    job_id: str,
    shortlisted: list,
    rejected_application_ids: list,
    db_client
) -> dict:
    """
    Args:
        job_id:                      The job being processed.
        shortlisted:                 Ranking entries with `application_id` keys.
        rejected_application_ids:   Application IDs NOT in the top-N.
        db_client:                   Motor DB client.

    Returns a summary dict for logging.
    """
    app_controller = await ApplicationController.create_instance(db_client)

    # ── 1. Mark top-N as accepted_for_interview ─────────────────────────────
    accepted_ids = [
        entry["application_id"]
        for entry in shortlisted
        if entry.get("application_id")
    ]
    accepted_count = await app_controller.bulk_update_status(
        accepted_ids,
        ApplicationStatusEnum.ACCEPTED_FOR_INTERVIEW
    )

    # ── 2. Mark the rest as rejected ────────────────────────────────────────
    rejected_count = await app_controller.bulk_reject_except(
        job_id=job_id,
        accepted_application_ids=accepted_ids
    )

    summary = {
        "accepted_count": accepted_count,
        "rejected_count": rejected_count
    }
    logger.info(
        f"[Step 4] job={job_id} | "
        f"accepted_for_interview={accepted_count} | rejected={rejected_count}"
    )
    return summary
