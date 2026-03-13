from .BaseController import BaseController
from ..models import JobModel
from ..models.db_schemes import JobScheme, CV
from bson.objectid import ObjectId
import logging
from Module_1.src.ranking_system.engine import rank_cvs_for_job
from Module_1.src.controllers.FeedbackController import FeedbackController
from ..helpers.cloudinary_service import upload_file
import os
from Module_1.src.helpers.job_skills import JobSkillsStore
from .ApplicationController import ApplicationController
from ..models import CVModel
logger = logging.getLogger("uvicorn.error")


class JobController(BaseController):

    def __init__(self):
        super().__init__()
        self.db_client = None
        self.job_model = None
        self.faiss_service_job = None
        self.skills_embedder=None

    @classmethod
    async def create_instance(cls, db_client, faiss_service_job=None,skills_embedder=None):
        instance = cls()
        instance.db_client = db_client
        instance.job_model = await JobModel.create_instance(db_client=db_client)
        instance.faiss_service_job = faiss_service_job
        instance.skills_embedder=skills_embedder
        return instance

    async def create_job(self, recruiter_id: str, job_data: JobScheme):

        job_dict = job_data.model_dump(by_alias=True, exclude_none=True)
        job_dict["job_recruiter_id"] = ObjectId(recruiter_id)

        # Check if a similar job already exists
        existing_job = await self.job_model.find_duplicate_job(
            ObjectId(recruiter_id),
            job_dict["job_title"],
            job_dict["location"]
        )
        
        if existing_job:
            raise Exception("JOB_ALREADY_EXISTS")

        result = await self.job_model.insert_job(job_dict)
        return result

    async def get_jobs_by_recruiter(self, recruiter_id: str):
        records = await self.job_model.find_by_recruiter(ObjectId(recruiter_id))

        jobs = []
        for doc in records:
            doc["id"] = str(doc["_id"])  # map Mongo _id → id
            doc["job_recruiter_id"] = str(doc["job_recruiter_id"])
            del doc["_id"]               # remove raw Mongo field

            jobs.append(JobScheme(**doc))

        return jobs

    async def get_job(self, job_id: str):
        job = await self.job_model.find_by_id(ObjectId(job_id))

        if not job:
            raise Exception("JOB_NOT_FOUND")

        return JobScheme(**job)
    
    async def update_job(self, job_id: str, job_data: JobScheme):
        update_data = job_data.model_dump(exclude_unset=True)
        await self.job_model.update_job(ObjectId(job_id), update_data)
        return await self.get_job(job_id)

    async def delete_job(self, job_id: str):
        result = await self.job_model.delete_job(ObjectId(job_id))
        if result.deleted_count == 0:
            raise Exception("JOB_NOT_FOUND")
        
        # Also delete skills embeddings if FAISS service is available
        if self.skills_embedder:
            try:
                self.skills_embedder.delete_job_skills_embeddings(job_id)
            except Exception as e:
                logger.warning(f"Non-critical: Failed to delete job skills embeddings: {e}")
        
        return True
    
    async def delete_jobs_by_recruiter(self, recruiter_id: str) -> int:
        """
        Delete all jobs for a given recruiter.
        Returns the number of deleted jobs.
        """
        # Get all jobs for this recruiter first (to delete their embeddings)
        recruiter_obj_id = ObjectId(recruiter_id)
        jobs_to_delete = await self.job_model.find_by_recruiter(recruiter_obj_id)
        
        # Delete skills embeddings for each job
        if self.skills_embedder:
            for job_doc in jobs_to_delete:
                try:
                    job_id = str(job_doc.get("_id"))
                    self.skills_embedder.delete_job_skills_embeddings(job_id)
                except Exception as e:
                    logger.warning(f"Non-critical: Failed to delete skills embeddings for job {job_id}: {e}")
        
        # Convert to ObjectId
        recruiter_obj_id = ObjectId(recruiter_id)

        # Call the model function
        result = await self.job_model.delete_by_recruiter(recruiter_obj_id)

        # result.deleted_count contains the number of deleted documents
        return result.deleted_count
    
    
    # ------------------------------
    # New: Get all jobs
    # ------------------------------
    async def get_all_jobs(self):
        records = await self.job_model.find_all_jobs()
        jobs = []
        for doc in records:
            doc["id"] = str(doc["_id"])
            if "job_recruiter_id" in doc:
                doc["job_recruiter_id"] = str(doc["job_recruiter_id"])
            del doc["_id"]
            jobs.append(JobScheme(**doc))
        return jobs

    # ------------------------------
    # New: Get jobs by cluster_id
    # ------------------------------
    async def get_jobs_by_cluster(self, cluster_id: int):
        records = await self.job_model.find_jobs_by_cluster(cluster_id)
        jobs = []
        for doc in records:
            doc["id"] = str(doc["_id"])
            if "job_recruiter_id" in doc:
                doc["job_recruiter_id"] = str(doc["job_recruiter_id"])
            del doc["_id"]
            jobs.append(JobScheme(**doc))
        return jobs

    # ------------------------------
    # New: Get recommended jobs for a user
    # ------------------------------
    async def get_recommended_jobs(self, user_id: str):
        """
        Fetch all recommended jobs for a user based on their CV cluster IDs.
        """
        import traceback as _tb

        try:
            cv_model = await CVModel.create_instance(self.db_client)
            logger.info(f"[recommended_jobs] CVModel ready for user={user_id}")

            user_cvs = await cv_model.get_all_user_cvs(cv_user_id=user_id)
            logger.info(f"[recommended_jobs] {len(user_cvs)} CVs found")

            cluster_ids = list({
                cv.cluster_id
                for cv in user_cvs
                if cv.cluster_id is not None
            })
            logger.info(f"[recommended_jobs] cluster_ids={cluster_ids}")

            if not cluster_ids:
                return []

            seen_job_ids: set = set()
            recommended_jobs = []

            for cluster_id in cluster_ids:
                cluster_jobs = await self.get_jobs_by_cluster(cluster_id)
                logger.info(f"[recommended_jobs] cluster {cluster_id} → {len(cluster_jobs)} jobs")
                for job in cluster_jobs:
                    job_id_str = str(job.id)
                    if job_id_str not in seen_job_ids:
                        seen_job_ids.add(job_id_str)
                        recommended_jobs.append(job)

            logger.info(f"[recommended_jobs] returning {len(recommended_jobs)} deduplicated jobs")
            return recommended_jobs

        except Exception as exc:
            logger.error(
                f"[recommended_jobs] FAILED for user={user_id}: {exc}\n"
                + _tb.format_exc()
            )
            raise
    
    async def get_rankings(self, job_id: str, config: dict, faiss_service_cv, faiss_service_job) -> list:
        try:
            job = await self.get_job(job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return []

            application_controller = await ApplicationController.create_instance(self.db_client)
            applications = await application_controller.get_applications_by_job(job_id)

            if not applications:
                logger.info(f"No applications found for job {job_id}")
                return []

            cv_model = await CVModel.create_instance(self.db_client)

            cvs = []
            app_map = {}

            for app in applications:
                try:
                    cv_record = await cv_model.collection.find_one({"_id": ObjectId(app.candidate_cv_id)})
                    if cv_record:
                        cv_obj = CV(**cv_record)
                        cvs.append(cv_obj)

                        # Map CV -> application
                        app_map[str(cv_obj.id)] = app

                    else:
                        logger.warning(f"CV {app.candidate_cv_id} not found")
    
                except Exception as e:
                    logger.warning(f"Error fetching CV {app.candidate_cv_id}: {e}")
                    continue

            if not cvs:
                logger.warning(f"No valid CVs found for job {job_id}")
                return []

            logger.info(f"Ranking {len(cvs)} CVs for job {job_id}")

            rankings = rank_cvs_for_job(job, cvs, config, faiss_service_cv, faiss_service_job)
            # ----------------------------
            # Generate Feedback + Update DB
            # ----------------------------

            for rank in rankings:
                details = rank.get("details", {})
                cv_id = rank["cv_id"]
                application = app_map.get(str(cv_id))

                if not application:
                    continue

                try:

                    # Get CV text
                    cv_record = await cv_model.collection.find_one({"_id": ObjectId(cv_id)})
                    cv_text = cv_record.get("cv_text", "")
                    feddback_controller = FeedbackController()
                    # Generate AI feedback
                    feedback = feddback_controller.generate_feedback_pdf(
                        job.job_title,
                        job.job_description,
                        cv_text
                    )
                    #save feedback to a file and get URL (simulate)
                    # Upload to Cloudinary
                    try:
                        upload_result = upload_file(
                        file_bytes=feedback,
                        folder=f"feedbacks/{str(cv_record.get('cv_user_id', ''))}",
                        resource_type="raw"
                        )

                        file_url = upload_result["secure_url"]
                        public_id = upload_result["public_id"]

                    except Exception as e:
                        logger.error(f"Cloud upload error: {e}")

                    # Update application
                    await application_controller.collection.update_one(
                        {"_id": ObjectId(application.id)},
                        {
                            "$set": {
                                "matching_score": rank["final_score"],
                                "matching_skills": details.get("matched_skills", []),
                                "missing_skills": details.get("missing_skills", []),
                                "cv_feedback_url": file_url,
                                "cv_feedback_public_id": public_id
                            }
                        }
                    )

                except Exception as e:
                    logger.warning(f"Error generating feedback for CV {cv_id}: {e}")

            return rankings

        except Exception as e:
            logger.error(f"Error getting rankings for job {job_id}: {e}", exc_info=True)
            return []