"""
Step 6 – Update Candidate Dashboards
======================================
The `upcoming_interview` field has already been written to each application
document by Step 5 (via `update_interview_schedule`).

This step handles supplementary notifications:
  - Logs a structured summary (ready to swap out for email/push/SMS)
  - Optionally fires a placeholder notification for each scheduled candidate

To wire in a real email service, replace `_send_notification()` with
your SMTP / SendGrid / etc. call.
"""
import logging

logger = logging.getLogger(__name__)


async def update_dashboards(scheduled_interviews: list, job_data: dict) -> None:
    """
    Args:
        scheduled_interviews:  Output from step 5 – list of { application_id,
                               scheduled_date, slot_index }.
        job_data:              The raw job document dict.
    """
    if not scheduled_interviews:
        logger.info("[Step 6] No interviews to notify.")
        return

    job_title = job_data.get("job_title", "N/A")
    job_id    = str(job_data.get("_id", ""))

    for item in scheduled_interviews:
        app_id    = item["application_id"]
        sched_date = item["scheduled_date"]
        slot      = item["slot_index"]

        await _send_notification(
            application_id=app_id,
            job_id=job_id,
            job_title=job_title,
            scheduled_date=sched_date,
            slot_index=slot
        )

    logger.info(
        f"[Step 6] Dashboard update complete | "
        f"job={job_id} | notified={len(scheduled_interviews)} candidate(s)"
    )


async def _send_notification(
    application_id: str,
    job_id: str,
    job_title: str,
    scheduled_date: str,
    slot_index: int
) -> None:
    """
    Placeholder notification dispatcher.
    Replace the logger.info call with real email/push logic when ready.

    The candidate dashboard reads `upcoming_interview` from the application
    document — that field is already written by Step 5, so the frontend
    updates automatically on next fetch without needing a push event.
    """
    logger.info(
        f"[Step 6] 📅 INTERVIEW SCHEDULED | "
        f"application={application_id} | job='{job_title}' ({job_id}) | "
        f"date={scheduled_date} | slot={slot_index}"
    )
    # ── Future hook ──────────────────────────────────────────────────────────
    # await send_email(candidate_email, subject="Interview Scheduled", ...)
    # await push_notification(candidate_id, payload={...})
    # ─────────────────────────────────────────────────────────────────────────
