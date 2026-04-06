"""
Hiring Automation Service
==========================
This module is the public entry-point called from:
  - JobRoute.py (PATCH /{job_id}/status   → background_tasks.add_task)
  - JobRoute.py (POST  /{job_id}/trigger-pipeline → admin endpoint)
  - expiry_scheduler.py (APScheduler hourly job)

All heavy logic lives in the pipeline package under helpers/pipeline/.
This file is intentionally thin — it just sets up context and delegates.
"""
import logging
from .pipeline import run_pipeline

logger = logging.getLogger(__name__)


async def run_hiring_automation(job_data: dict, app, force: bool = False) -> dict:
    """
    Orchestrates the full ranking → selection → scheduling pipeline
    for a job that has just moved to 'closed' or 'expired'.

    Args:
        job_data:  Raw MongoDB document for the job (dict with _id, etc.)
        app:       FastAPI application instance.
        force:     Bypass the idempotency guard if True.

    Returns:
        The pipeline result summary dict produced by orchestrator.run_pipeline().
    """
    job_id = str(job_data.get("_id", "unknown"))
    logger.info(f"[Automation] Delegating to pipeline for job {job_id}")

    try:
        result = await run_pipeline(job_data, app, force=force)
        if result.get("success"):
            logger.info(f"[Automation] Pipeline succeeded for job {job_id}")
        else:
            logger.error(f"[Automation] Pipeline reported failure for job {job_id}: {result}")
        return result

    except Exception as e:
        logger.error(
            f"[Automation] Unhandled exception for job {job_id}: {e}",
            exc_info=True
        )
        return {"job_id": job_id, "success": False, "error": str(e)}