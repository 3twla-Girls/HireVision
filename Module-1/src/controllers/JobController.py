from .BaseController import BaseController
from models import JobModel, ProjectModel
from models.db_schemes import JobScheme
from bson.objectid import ObjectId
import logging

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

        result = await self.job_model.collection.insert_one(job_dict)
        return result

    async def get_jobs_by_project(self, project_id: str):
        project_model = await ProjectModel.create_instance(db_client=self.db_client)
        project = await project_model.get_project_or_create_one(project_id)

        jobs = await self.job_model.collection.find(
            {"job_project_id": project.id}
        ).to_list(None)
        
        for job in jobs:
            job["_id"] = str(job["_id"])
            job["job_project_id"] = str(job["job_project_id"])
            job["created_at"] = job["created_at"].isoformat()


        return jobs

    async def get_job(self, job_id: str):
        job = await self.job_model.collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise Exception("JOB_NOT_FOUND")
        
        job["_id"] = str(job["_id"])
        job["job_project_id"] = str(job["job_project_id"])
        if "created_at" in job:
            job["created_at"] = job["created_at"].isoformat()

        return job


    async def update_job(self, job_id: str, job_data: JobScheme):
        updated = await self.job_model.collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": job_data.model_dump(exclude_unset=True)}
        )

        if updated.modified_count == 0:
            raise Exception("JOB_NOT_FOUND")

        return await self.get_job(job_id)

    async def delete_job(self, job_id: str):
        deleted = await self.job_model.collection.delete_one(
            {"_id": ObjectId(job_id)}
        )

        if deleted.deleted_count == 0:
            raise Exception("JOB_NOT_FOUND")

        return True
