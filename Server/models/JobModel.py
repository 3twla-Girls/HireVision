from .BaseDataModel import BaseDataModel
from .db_schemes import JobScheme
from .enums.DataBaseEnum import DataBaseEnum
from bson import ObjectId

class JobModel(BaseDataModel):
    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_JOB_NAME.value]
        
    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance
    
    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_JOB_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_JOB_NAME.value]
            indexes = JobScheme.get_indexes()
            for index in indexes:
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"]
                )

    async def insert_job(self, job_dict: dict):
        return await self.collection.insert_one(job_dict)

    async def find_by_recruiter(self, recruiter_id: ObjectId):
        return await self.collection.find({"job_recruiter_id": recruiter_id}).to_list(None)

    async def find_by_id(self, job_id: ObjectId):
        return await self.collection.find_one({"_id": job_id})

    async def find_duplicate_job(self, recruiter_id: ObjectId, job_title: str, location: str):
        """Check if a job with the same recruiter, title, and location already exists"""
        return await self.collection.find_one({
            "job_recruiter_id": recruiter_id,
            "job_title": job_title,
            "location": location
        })

    async def update_job(self, job_id: ObjectId, update_data: dict):
        return await self.collection.update_one({"_id": job_id}, {"$set": update_data})

    async def delete_job(self, job_id: ObjectId):
        return await self.collection.delete_one({"_id": job_id})

    async def delete_by_recruiter(self, recruiter_id: ObjectId):
        return await self.collection.delete_many(
            {"job_recruiter_id": recruiter_id}
        )
        
    # in JobModel
    async def find_all_jobs(self):
        return await self.collection.find({}).to_list(length=None)

    async def find_jobs_by_cluster(self, cluster_id: int):
        return await self.collection.find({"cluster_id": cluster_id}).to_list(length=None)