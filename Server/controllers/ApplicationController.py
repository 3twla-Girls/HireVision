from .BaseController import BaseController
from ..models.db_schemes.Application import Application
from ..models.enums.DataBaseEnum import DataBaseEnum
from ..models.enums.ApplicationEnum import ApplicationStatusEnum
from bson import ObjectId
from typing import List, Optional


class ApplicationController(BaseController):

    def __init__(self, db_client=None):
        super().__init__()
        self.db_client = db_client
        self.collection = None

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls(db_client=db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        self.collection = self.db_client[DataBaseEnum.COLLECTION_APPLICATION_NAME.value]
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_APPLICATION_NAME.value not in all_collections:
            indexes = Application.get_indexes()
            for index in indexes:
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"]
                )

    # ---------------- CREATE ----------------
    async def create_application(self, application: Application) -> Application:
    
        # Check for duplicate application
        existing = await self.collection.find_one({
            "job_id": ObjectId(application.job_id),
            "candidate_id": ObjectId(application.candidate_id),
            "candidate_cv_id": ObjectId(application.candidate_cv_id)
        })
        if existing:
            raise Exception("Application with the same job, candidate, and CV already exists")

        data = application.dict(by_alias=True, exclude_none=True)
        data.pop("_id", None)
        data["job_id"] = ObjectId(data["job_id"])
        data["candidate_id"] = ObjectId(data["candidate_id"])
        data["candidate_cv_id"] = ObjectId(data["candidate_cv_id"])

        result = await self.collection.insert_one(data)
        application.id = str(result.inserted_id)
        application.job_id = str(data["job_id"])
        application.candidate_id = str(data["candidate_id"])
        application.candidate_cv_id = str(data["candidate_cv_id"])
        return application

    # ---------------- READ ----------------
    async def get_application_by_id(self, application_id: str) -> Optional[Application]:
        record = await self.collection.find_one({"_id": ObjectId(application_id)})
        if record is None:
            raise Exception(f"Application with id {application_id} not found")
        return self._convert_record_to_application(record)

    async def get_applications_by_job(self, job_id: str, skip: int = 0, limit: int = 50) -> List[Application]:
        records = await (
            self.collection
            .find({"job_id": ObjectId(job_id)})
            .skip(skip)
            .limit(limit)
            .to_list(length=None)
        )
        return [self._convert_record_to_application(r) for r in records]

    async def get_applications_by_candidate(self, candidate_id: str) -> List[Application]:
        records = await self.collection.find(
            {"candidate_id": ObjectId(candidate_id)}
        ).to_list(length=None)
        return [self._convert_record_to_application(r) for r in records]

    async def get_applications_by_status(self, status: ApplicationStatusEnum) -> List[Application]:
        records = await self.collection.find(
            {"status": status.value}
        ).to_list(length=None)
        return [self._convert_record_to_application(r) for r in records]

    # ---------------- UPDATE ----------------
    async def update_matching_result(
        self,
        application_id: str,
        score: float,
        matched_skills: List[str],
        missing_skills: List[str]
    ) -> Optional[Application]:
        result = await self.collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {
                "matching_score": score,
                "matching_skills": matched_skills,
                "missing_skills": missing_skills
            }}
        )
        if result.matched_count == 0:
            raise Exception(f"Application with id {application_id} not found")
        return await self.get_application_by_id(application_id)

    async def update_status(
        self,
        application_id: str,
        status: ApplicationStatusEnum
    ) -> Optional[Application]:
        result = await self.collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": status.value}}
        )
        if result.matched_count == 0:
            raise Exception(f"Application with id {application_id} not found")
        return await self.get_application_by_id(application_id)

    # ---------------- DELETE ----------------
    async def delete_application(self, application_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(application_id)})
        if result.deleted_count == 0:
            raise Exception(f"Application with id {application_id} not found")
        return True

    # ---------------- DELETE ----------------
    async def delete_applications_by_user_id(self, user_id: str) -> int:
        result = await self.collection.delete_many({
            "candidate_id": ObjectId(user_id)
        })

        return result.deleted_count
    
    async def delete_applications_by_recruiter_jobs(self, recruiter_id: str):
        # 1️⃣ Get recruiter job IDs
        from .JobController import JobController
        job_controller = await JobController.create_instance(self.db_client)
        jobs = await job_controller.get_jobs_by_recruiter(recruiter_id)

        job_ids = [ObjectId(job.id) for job in jobs]

        if not job_ids:
            return 0

        result = await self.collection.delete_many({
        "job_id": {"$in": job_ids}
        })

        return result.deleted_count
    # ---------------- UTILITY ----------------
    def _convert_record_to_application(self, record: dict) -> Application:
        record["_id"] = str(record["_id"])
        record["job_id"] = str(record["job_id"])
        record["candidate_id"] = str(record["candidate_id"])
        record["candidate_cv_id"] = str(record["candidate_cv_id"])
        return Application(**record)