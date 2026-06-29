"""
Step 5 – Schedule Interviews
==============================
Assigns ALL shortlisted candidates the same interview date:

    interview_date = now + interview_gap_days

Every accepted candidate shares the same date so they all know
when to appear for their interview.

Each application document is updated with:
    - scheduled_interview_date  (YYYY-MM-DD string)
    - interview_slot_index      (int)
"""
import logging
from datetime import datetime, timedelta
from ...controllers.ApplicationController import ApplicationController

logger = logging.getLogger(__name__)


async def schedule_interviews(
    shortlisted: list,
    interview_gap_days: int,
    job_title: str,
    db_client
) -> list:
    """
    Args:
        shortlisted:          List of ranking entries with `application_id`.
        interview_gap_days:   Days from now before the first interview slot.
        job_title:            Used in the `upcoming_interview` dashboard field.
        db_client:            Motor DB client.

    Returns:
        List of dicts with { application_id, scheduled_date, slot_index }.
    """
    if not shortlisted:
        return []

    app_controller = await ApplicationController.create_instance(db_client)
    base_date = datetime.now() + timedelta(days=max(0, interview_gap_days))
    scheduled = []

    for slot_index, entry in enumerate(shortlisted):
        application_id = entry.get("application_id")
        if not application_id:
            logger.warning(f"[Step 5] Entry missing application_id – skipping: {entry}")
            continue

        interview_date = base_date  # all candidates share the same date
        scheduled_date_str = interview_date.strftime("%Y-%m-%d")

        try:
            await app_controller.update_interview_schedule(
                application_id=application_id,
                scheduled_date=scheduled_date_str,
                slot_index=slot_index,
                job_title=job_title
            )
            scheduled.append({
                "application_id": application_id,
                "scheduled_date": scheduled_date_str,
                "slot_index": slot_index
            })
        except Exception as e:
            logger.error(
                f"[Step 5] Failed to schedule interview for application "
                f"{application_id}: {e}"
            )

    logger.info(
        f"[Step 5] Scheduled {len(scheduled)} interviews | "
        f"first slot: {base_date.strftime('%Y-%m-%d')}"
    )
    return scheduled
