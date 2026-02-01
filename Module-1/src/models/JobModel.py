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

    async def find_by_project(self, project_id: ObjectId):
        return await self.collection.find({"job_project_id": project_id}).to_list(None)

    async def find_by_id(self, job_id: ObjectId):
        return await self.collection.find_one({"_id": job_id})

    async def update_job(self, job_id: ObjectId, update_data: dict):
        return await self.collection.update_one({"_id": job_id}, {"$set": update_data})

    async def delete_job(self, job_id: ObjectId):
        return await self.collection.delete_one({"_id": job_id})
