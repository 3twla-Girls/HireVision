"""
Expiry Date Scheduler
======================
Runs an hourly background job that:
  1. Queries all 'open' jobs whose expiry_date <= today
  2. Marks each one as 'expired'
  3. Fires the hiring automation pipeline for each expired job

Usage (in main.py lifespan):
    from .helpers.expiry_scheduler import start_expiry_scheduler, stop_expiry_scheduler

    # on startup:
    start_expiry_scheduler(app)

    # on shutdown:
    stop_expiry_scheduler()
"""
import logging
from datetime import datetime, date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .hiring_automating_service import run_hiring_automation

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _check_and_close_expired_jobs(app) -> None:
    """
    The actual job run by APScheduler every hour.
    Finds open jobs past their expiry_date and triggers the pipeline.
    """
    today_str = date.today().isoformat()   # "YYYY-MM-DD"
    logger.info(f"[ExpiryScheduler] Checking for expired jobs on {today_str} …")

    try:
        from ..models.JobModel import JobModel

        job_model = await JobModel.create_instance(app.db_client)
        expired_jobs = await job_model.find_expired_open_jobs(today_str)

        if not expired_jobs:
            logger.info("[ExpiryScheduler] No expired jobs found.")
            return

        logger.info(f"[ExpiryScheduler] Found {len(expired_jobs)} expired job(s) — processing …")

        for job_doc in expired_jobs:
            job_id = job_doc.get("_id")
            job_title = job_doc.get("job_title", "N/A")

            try:
                # 1️⃣ Mark the job as 'expired'
                await job_model.update_job(job_id, {"status": "expired"})
                logger.info(
                    f"[ExpiryScheduler] Job '{job_title}' ({job_id}) → status=expired"
                )

                # 2️⃣ Run the hiring pipeline
                await run_hiring_automation(job_doc, app)

            except Exception as e:
                logger.error(
                    f"[ExpiryScheduler] Failed to process expired job {job_id}: {e}",
                    exc_info=True
                )

    except Exception as e:
        logger.error(f"[ExpiryScheduler] Scheduler tick failed: {e}", exc_info=True)


def start_expiry_scheduler(app, interval_hours: int = 1) -> None:
    """
    Start the APScheduler async scheduler.
    Call once from the FastAPI lifespan startup block.

    Args:
        app:             The FastAPI application instance.
        interval_hours:  How often to check (default: every 1 hour).
    """
    global _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _check_and_close_expired_jobs,
        trigger=IntervalTrigger(hours=interval_hours),
        args=[app],
        id="expiry_checker",
        name="Expiry Date Job Closer",
        replace_existing=True,
        # Also run once immediately on startup so we don't wait a full hour
        next_run_time=datetime.now()
    )
    _scheduler.start()
    logger.info(
        f"[ExpiryScheduler] Started — checking every {interval_hours}h "
        f"(first run: immediate)"
    )


def stop_expiry_scheduler() -> None:
    """
    Gracefully shut down the scheduler.
    Call from the FastAPI lifespan shutdown block.
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[ExpiryScheduler] Stopped.")
    _scheduler = None
