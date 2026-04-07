import logging
from bson import ObjectId

from .BaseController import BaseController
from ..models.enums.DataBaseEnum import DataBaseEnum
from ..models.UserModel import UserModel
from ..models.JobModel import JobModel
from ..helpers.email_service import (
    send_email,
    build_interview_invitation,
    build_status_update,
    build_interview_result,
)

logger = logging.getLogger("uvicorn.error")


class EmailController(BaseController):
    """
    Handles all outbound emails triggered by recruiter actions.
    Every public method fetches what it needs from the DB, builds the
    correct HTML template, and dispatches via email_service.send_email().
    """

    def __init__(self, db_client=None):
        super().__init__()
        self.db_client = db_client

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls(db_client=db_client)
        return instance

    # ------------------------------------------------------------------
    # PRIVATE HELPERS — fetch documents from MongoDB
    # ------------------------------------------------------------------

    async def _get_session(self, session_id: str) -> dict:
        # interview_sessions collection is accessed directly via enum
        collection = self.db_client[
            DataBaseEnum.COLLECTION_INTERVIEW_SESSIONS_NAME.value
        ]
        session = await collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise Exception(f"Session {session_id} not found")
        return session

    async def _get_job(self, job_id: str) -> dict:
        # Use JobModel so it targets the correct collection via DataBaseEnum
        job_model = await JobModel.create_instance(self.db_client)
        job = await job_model.find_by_id(ObjectId(job_id))
        if not job:
            raise Exception(f"Job {job_id} not found")
        return job

    async def _get_user(self, user_id: str) -> dict:
        # Use UserModel — it hardcodes the "users" collection name
        user_model = await UserModel.create_instance(self.db_client)
        user = await user_model.find_by_id(ObjectId(user_id))
        if not user:
            raise Exception(f"User {user_id} not found")
        return user

    async def _get_recruiter(self, recruiter_id: str) -> dict:
        return await self._get_user(recruiter_id)

    # ------------------------------------------------------------------
    # 1. SEND INTERVIEW INVITATION
    #    Called by the recruiter to invite a candidate to their session.
    # ------------------------------------------------------------------
    async def send_interview_invitation(
        self,
        session_id: str,
        recruiter_id: str,
        interview_date: str,        # e.g. "2026-04-10 03:00 PM"
        interview_link: str = "",
        extra_notes: str = ""
    ) -> dict:
        """
        Looks up session → candidate → job → recruiter, then sends
        a branded invitation email to the candidate.
        """
        # 1. Load session
        session = await self._get_session(session_id)
        candidate_id = session.get("candidate_id")
        job_id       = session.get("job_id")

        # 2. Load candidate
        candidate = await self._get_user(str(candidate_id))
        candidate_email = candidate.get("email")
        candidate_name  = candidate.get("name", "Candidate")

        if not candidate_email:
            raise Exception(f"Candidate {candidate_id} has no email address")

        # 3. Load job & recruiter
        job           = await self._get_job(str(job_id))
        recruiter     = await self._get_recruiter(recruiter_id)
        job_title     = job.get("job_title", "Open Position")
        company_name  = recruiter.get("company_name", "Our Company")
        recruiter_name = recruiter.get("name", "The Hiring Team")

        # 4. Build & send
        subject, html = build_interview_invitation(
            candidate_name  = candidate_name,
            job_title       = job_title,
            company_name    = company_name,
            interview_date  = interview_date,
            session_id      = session_id,
            recruiter_name  = recruiter_name,
            interview_link  = interview_link,
            extra_notes     = extra_notes,
        )

        success = send_email(candidate_email, subject, html)

        return {
            "status":  "sent" if success else "failed",
            "to":      candidate_email,
            "subject": subject,
        }

    # ------------------------------------------------------------------
    # 2. SEND STATUS UPDATE
    #    Notify a candidate that their application status has changed.
    # ------------------------------------------------------------------
    async def send_status_update(
        self,
        candidate_id: str,
        job_id: str,
        recruiter_id: str,
        application_status: str,    # "shortlisted" | "accepted" | "rejected"
        custom_message: str = ""
    ) -> dict:
        """
        Sends a status-change notification to the candidate.
        """
        candidate     = await self._get_user(candidate_id)
        job           = await self._get_job(job_id)
        recruiter     = await self._get_recruiter(recruiter_id)

        candidate_email = candidate.get("email")
        candidate_name  = candidate.get("name", "Candidate")

        if not candidate_email:
            raise Exception(f"Candidate {candidate_id} has no email address")

        job_title      = job.get("job_title", "Open Position")
        company_name   = recruiter.get("company_name", "Our Company")
        recruiter_name = recruiter.get("name", "The Hiring Team")

        subject, html = build_status_update(
            candidate_name  = candidate_name,
            job_title       = job_title,
            company_name    = company_name,
            status          = application_status,
            recruiter_name  = recruiter_name,
            custom_message  = custom_message,
        )

        success = send_email(candidate_email, subject, html)

        return {
            "status":  "sent" if success else "failed",
            "to":      candidate_email,
            "subject": subject,
        }

    # ------------------------------------------------------------------
    # 3. SEND INTERVIEW RESULT
    #    After final_summary is generated, share the score with the candidate.
    # ------------------------------------------------------------------
    async def send_interview_result(
        self,
        session_id: str,
        recruiter_id: str,
        next_steps: str = ""
    ) -> dict:
        """
        Reads the technical score from the session's final_summary
        and emails the result to the candidate.
        """
        session      = await self._get_session(session_id)
        candidate_id = session.get("candidate_id")
        job_id       = session.get("job_id")

        # Pull technical score from the stored summary
        final_summary    = session.get("final_summary", {})
        technical_data   = final_summary.get("technical") or {}
        # The evaluator stores overall_score or falls back to 0
        technical_score  = float(
            technical_data.get("overall_score")
            or technical_data.get("score")
            or 0
        )

        candidate     = await self._get_user(str(candidate_id))
        job           = await self._get_job(str(job_id))
        recruiter     = await self._get_recruiter(recruiter_id)

        candidate_email = candidate.get("email")
        candidate_name  = candidate.get("name", "Candidate")

        if not candidate_email:
            raise Exception(f"Candidate {candidate_id} has no email address")

        job_title      = job.get("job_title", "Open Position")
        company_name   = recruiter.get("company_name", "Our Company")
        recruiter_name = recruiter.get("name", "The Hiring Team")

        subject, html = build_interview_result(
            candidate_name  = candidate_name,
            job_title       = job_title,
            company_name    = company_name,
            technical_score = technical_score,
            recruiter_name  = recruiter_name,
            next_steps      = next_steps,
        )

        success = send_email(candidate_email, subject, html)

        return {
            "status":          "sent" if success else "failed",
            "to":              candidate_email,
            "subject":         subject,
            "technical_score": technical_score,
        }

    # ------------------------------------------------------------------
    # 4. BULK INVITE — shortlisted candidates for a job
    #    Convenience wrapper used by hiring_automating_service.
    # ------------------------------------------------------------------
    async def bulk_send_invitations(
        self,
        session_ids: list[str],
        recruiter_id: str,
        interview_date: str,
        interview_link: str = "",
        extra_notes: str = ""
    ) -> dict:
        """
        Sends interview invitations to multiple candidates at once.
        Returns a summary of successes and failures.
        """
        results = {"sent": [], "failed": []}

        for session_id in session_ids:
            try:
                result = await self.send_interview_invitation(
                    session_id     = session_id,
                    recruiter_id   = recruiter_id,
                    interview_date = interview_date,
                    interview_link = interview_link,
                    extra_notes    = extra_notes,
                )
                if result["status"] == "sent":
                    results["sent"].append(session_id)
                else:
                    results["failed"].append(session_id)

            except Exception as e:
                logger.error(f"Bulk invite failed for session {session_id}: {e}")
                results["failed"].append(session_id)

        logger.info(
            f"Bulk invite complete → sent:{len(results['sent'])} "
            f"failed:{len(results['failed'])}"
        )
        return results
