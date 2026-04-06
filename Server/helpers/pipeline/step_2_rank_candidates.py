"""
Step 2 – Rank Candidates
=========================
Delegates to the existing `JobController.get_rankings()` which uses:
  - FAISS semantic similarity (CV ↔ job description)
  - Skills-match scoring via Module_1
  - Experience weighting
  - AI feedback generation (Cloudinary upload)

Each ranking entry looks like:
  {
      "cv_id": "<cv_id>",
      "candidate_id": "<candidate_id>",
      "final_score": 0.87,
      "details": { "matched_skills": [...], "missing_skills": [...] }
  }

If get_rankings() returns an empty list (e.g., no CVs/FAISS data),
we fall back to sorting applications by their pre-computed `matching_score`
and `years_of_exp` so the pipeline never silently stalls.
"""
import logging
from ...controllers.JobController import JobController
from ...controllers.ApplicationController import ApplicationController
from bson import ObjectId

logger = logging.getLogger(__name__)


async def rank_candidates(job_id: str, applications: list, app) -> list:
    """
    Returns a ranked list of dicts:
      [{ "cv_id", "candidate_id", "application_id", "final_score", ... }, ...]
    Sorted descending by final_score.
    """
    if not applications:
        return []

    # ── Primary: use the full FAISS + AI ranking engine ────────────────────
    try:
        job_controller = await JobController.create_instance(
            db_client=app.db_client,
            faiss_service_job=app.state.faiss_service["faiss_service_job"]
        )
        rankings = await job_controller.get_rankings(
            job_id=job_id,
            config=app.state.config,
            faiss_service_cv=app.state.faiss_service["faiss_service_cv"],
            faiss_service_job=app.state.faiss_service["faiss_service_job"]
        )

        if rankings:
            # Inject application_id into each ranking entry using cv_id lookup
            app_controller = await ApplicationController.create_instance(app.db_client)
            cv_to_app = {str(a.candidate_cv_id): str(a.id) for a in applications}

            for entry in rankings:
                cv_id = str(entry.get("cv_id", ""))
                entry["application_id"] = cv_to_app.get(cv_id, "")

            logger.info(f"[Step 2] FAISS rankings produced {len(rankings)} entries for job {job_id}")
            return rankings

    except Exception as e:
        logger.warning(f"[Step 2] FAISS ranking failed — falling back to score-based sort: {e}")

    # ── Fallback: sort by pre-computed matching_score + weighted experience ──
    logger.info(f"[Step 2] Using fallback scorer for job {job_id}")
    fallback = []
    for app_obj in applications:
        score = app_obj.matching_score or 0.0
        exp_bonus = min(app_obj.years_of_exp, 10) * 0.01   # up to +0.10
        composite = round(score + exp_bonus, 4)
        fallback.append({
            "cv_id": app_obj.candidate_cv_id,
            "candidate_id": app_obj.candidate_id,
            "application_id": str(app_obj.id),
            "final_score": composite,
            "details": {
                "matched_skills": app_obj.matching_skills or [],
                "missing_skills": app_obj.missing_skills or [],
                "note": "fallback_score"
            }
        })

    fallback.sort(key=lambda x: x["final_score"], reverse=True)
    logger.info(f"[Step 2] Fallback produced {len(fallback)} entries for job {job_id}")
    return fallback
