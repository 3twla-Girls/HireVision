from .BaseController import BaseController
from ..models import JobModel, ProjectModel
from ..models.db_schemes import JobScheme
from bson.objectid import ObjectId
import logging
from Module_1.src.ranking_system.engine import rank_cvs_for_job

logger = logging.getLogger("uvicorn.error")


class JobController(BaseController):

    def __init__(self):
        super().__init__()
        self.db_client = None
        self.job_model = None

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls()
        instance.db_client = db_client
        instance.job_model = await JobModel.create_instance(db_client=db_client)
        return instance

    async def create_job(self, project_id: str, job_data: JobScheme):
        project_model = await ProjectModel.create_instance(db_client=self.db_client)
        project = await project_model.get_project_or_create_one(project_id)

        job_dict = job_data.model_dump()
        job_dict["job_project_id"] = project.id

        result = await self.job_model.insert_job(job_dict)
        return result

    async def get_jobs_by_project(self, project_id: str):
        records = await self.job_model.find_by_project(ObjectId(project_id))
        for doc in records:
            doc["_id"] = str(doc["_id"])
            doc["job_project_id"] = str(doc["job_project_id"])
            if "created_at" in doc and doc["created_at"]:
                doc["created_at"] = doc["created_at"].isoformat()
        return records

    async def get_job(self, job_id: str):
        job = await self.job_model.find_by_id(ObjectId(job_id))
        if not job:
            raise Exception("JOB_NOT_FOUND")
        job["_id"] = str(job["_id"])
        job["job_project_id"] = str(job["job_project_id"])
        return job
    
    async def update_job(self, job_id: str, job_data: JobScheme):
        update_data = job_data.model_dump(exclude_unset=True)
        await self.job_model.update_job(ObjectId(job_id), update_data)
        return await self.get_job(job_id)

    async def delete_job(self, job_id: str):
        result = await self.job_model.delete_job(ObjectId(job_id))
        if result.deleted_count == 0:
            raise Exception("JOB_NOT_FOUND")
        return True
    
    async def get_rankings(self, job_id: str, embedder, config):
        job = await self.get_job(job_id)
        applicants = job.get("applicants", [])
        if not applicants:
            return []
            
        return rank_cvs_for_job(job, applicants, embedder, config)
#get all jobs
