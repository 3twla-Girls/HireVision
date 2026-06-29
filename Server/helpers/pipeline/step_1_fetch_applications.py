"""
Step 1 – Fetch Applications
============================
Retrieves all applications linked to a given job_id.
Returns a list of Application objects.
"""
import logging
from ...controllers.ApplicationController import ApplicationController

logger = logging.getLogger(__name__)


async def fetch_applications(job_id: str, db_client) -> list:
    """
    Fetch all applications for the given job.
    Returns an empty list if none exist (pipeline aborts gracefully).
    """
    app_controller = await ApplicationController.create_instance(db_client)
    applications = await app_controller.get_applications_by_job(job_id)

    logger.info(f"[Step 1] Found {len(applications)} application(s) for job {job_id}")
    return applications
