"""
Step 3 – Select Top-N Candidates
==================================
Slices the ranked list to the top N entries defined by `top_candidates_count`
on the job document.

Returns two lists:
  - shortlisted: top-N ranking entries
  - rejected_ids: application_id strings for everyone outside the cutoff
"""
import logging

logger = logging.getLogger(__name__)


def select_top_n(
    rankings: list,
    top_candidates_count: int,
    all_applications: list
) -> tuple[list, list]:
    """
    Args:
        rankings:             Full sorted ranking list from step 2.
        top_candidates_count: N — how many to shortlist.
        all_applications:     All Application objects for this job.

    Returns:
        (shortlisted, rejected_application_ids)
    """
    n = max(1, top_candidates_count)   # guard against 0
    shortlisted = rankings[:n]

    shortlisted_app_ids = {
        entry.get("application_id", "")
        for entry in shortlisted
        if entry.get("application_id")
    }

    # Everyone with a valid application_id not in shortlisted → rejected
    rejected_ids = [
        str(a.id)
        for a in all_applications
        if str(a.id) not in shortlisted_app_ids
    ]

    logger.info(
        f"[Step 3] Shortlisted {len(shortlisted)}/{len(rankings)} | "
        f"Rejected {len(rejected_ids)}"
    )
    return shortlisted, rejected_ids
