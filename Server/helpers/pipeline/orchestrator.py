"""
Pipeline Orchestrator
======================
Calls Steps 1-6 in sequence. Each step is wrapped in its own
try/except so a failure in one step is logged but doesn't crash
the whole background task.

Idempotency Guard:
  If the job already has any applications in `accepted_for_interview`
  state, the pipeline skips steps 4-6 to avoid duplicate scheduling.
  Pass `force=True` to override this guard (admin use only).
"""
import logging
from datetime import datetime

from .step_1_fetch_applications import fetch_applications
from .step_2_rank_candidates import rank_candidates
from .step_3_select_top_n import select_top_n
from .step_4_mark_accepted import mark_candidates
from .step_5_schedule_interviews import schedule_interviews
from .step_6_update_dashboards import update_dashboards

logger = logging.getLogger(__name__)


async def run_pipeline(job_data: dict, app, force: bool = False) -> dict:
    """
    Main entry point for the hiring automation pipeline.

    Args:
        job_data:  Raw job document dict (as stored in MongoDB).
        app:       The FastAPI application instance (for db_client + state).
        force:     If True, bypass the idempotency guard and re-run fully.

    Returns:
        A result summary dict describing what happened at each step.
    """
    job_id    = str(job_data.get("_id", ""))
    job_title = job_data.get("job_title", "Unknown Job")
    top_n     = job_data.get("top_candidates_count", 10)
    gap_days  = job_data.get("interview_gap_days", 5)

    result = {
        "job_id":     job_id,
        "job_title":  job_title,
        "started_at": datetime.utcnow().isoformat(),
        "steps":      {},
        "success":    False
    }

    logger.info(
        f"🚀 [Pipeline] START | job='{job_title}' ({job_id}) | "
        f"top_n={top_n} | gap_days={gap_days}"
    )

    # ── Step 1: Fetch Applications ─────────────────────────────────────────
    try:
        applications = await fetch_applications(job_id, app.db_client)
        result["steps"]["step_1"] = {"status": "ok", "count": len(applications)}

        if not applications:
            logger.warning(f"[Pipeline] No applications for job {job_id} – aborting.")
            result["steps"]["step_1"]["status"] = "aborted_no_applications"
            result["success"] = True          # not an error, just nothing to do
            return result

    except Exception as e:
        logger.error(f"[Pipeline] Step 1 FAILED: {e}", exc_info=True)
        result["steps"]["step_1"] = {"status": "error", "error": str(e)}
        return result

    # ── Idempotency Guard ──────────────────────────────────────────────────
    if not force:
        from ...controllers.ApplicationController import ApplicationController
        app_ctrl = await ApplicationController.create_instance(app.db_client)
        already_accepted = await app_ctrl.get_accepted_for_interview_by_job(job_id)
        if already_accepted:
            logger.info(
                f"[Pipeline] Idempotency guard: {len(already_accepted)} candidates "
                f"already accepted_for_interview for job {job_id}. "
                f"Skipping. Pass force=True to re-run."
            )
            result["steps"]["idempotency_guard"] = {
                "status": "skipped",
                "already_accepted": len(already_accepted)
            }
            result["success"] = True
            return result

    # ── Step 2: Rank Candidates ────────────────────────────────────────────
    try:
        rankings = await rank_candidates(job_id, applications, app)
        result["steps"]["step_2"] = {"status": "ok", "ranked": len(rankings)}

        if not rankings:
            logger.warning(f"[Pipeline] Ranking returned empty for job {job_id} – aborting.")
            result["steps"]["step_2"]["status"] = "aborted_no_rankings"
            result["success"] = True
            return result

    except Exception as e:
        logger.error(f"[Pipeline] Step 2 FAILED: {e}", exc_info=True)
        result["steps"]["step_2"] = {"status": "error", "error": str(e)}
        return result

    # ── Step 3: Select Top-N ───────────────────────────────────────────────
    try:
        shortlisted, rejected_ids = select_top_n(rankings, top_n, applications)
        result["steps"]["step_3"] = {
            "status":      "ok",
            "shortlisted": len(shortlisted),
            "rejected":    len(rejected_ids)
        }
    except Exception as e:
        logger.error(f"[Pipeline] Step 3 FAILED: {e}", exc_info=True)
        result["steps"]["step_3"] = {"status": "error", "error": str(e)}
        return result

    # ── Step 4: Mark accepted / rejected in DB ─────────────────────────────
    try:
        mark_summary = await mark_candidates(
            job_id=job_id,
            shortlisted=shortlisted,
            rejected_application_ids=rejected_ids,
            db_client=app.db_client
        )
        result["steps"]["step_4"] = {"status": "ok", **mark_summary}
    except Exception as e:
        logger.error(f"[Pipeline] Step 4 FAILED: {e}", exc_info=True)
        result["steps"]["step_4"] = {"status": "error", "error": str(e)}
        # Continue — don't abort; scheduling can still proceed

    # ── Step 5: Schedule Interviews ────────────────────────────────────────
    try:
        scheduled = await schedule_interviews(
            shortlisted=shortlisted,
            interview_gap_days=gap_days,
            job_title=job_title,
            db_client=app.db_client
        )
        result["steps"]["step_5"] = {
            "status":    "ok",
            "scheduled": len(scheduled)
        }
    except Exception as e:
        logger.error(f"[Pipeline] Step 5 FAILED: {e}", exc_info=True)
        result["steps"]["step_5"] = {"status": "error", "error": str(e)}
        scheduled = []

    # ── Step 6: Update Dashboards / Notify ────────────────────────────────
    try:
        await update_dashboards(scheduled, job_data)
        result["steps"]["step_6"] = {"status": "ok", "notified": len(scheduled)}
    except Exception as e:
        logger.error(f"[Pipeline] Step 6 FAILED: {e}", exc_info=True)
        result["steps"]["step_6"] = {"status": "error", "error": str(e)}

    result["success"] = True
    result["finished_at"] = datetime.utcnow().isoformat()

    logger.info(
        f"✅ [Pipeline] COMPLETE | job={job_id} | "
        f"shortlisted={len(shortlisted)} | scheduled={len(scheduled)}"
    )
    return result
