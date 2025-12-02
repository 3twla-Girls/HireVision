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

    async def create_job(self, job: JobScheme):
        
        result = await self.collection.insert_one(job.dict(by_alias=True, exclude_unset=True))
        job.id = result.inserted_id

        return job
    
    async def get_all_project_jobs(self, job_project_id: str):

        records = await self.collection.find({
            "job_project_id": ObjectId(job_project_id) if isinstance(job_project_id, str) else job_project_id,
        }).to_list(length=None)

        return [
            JobScheme(**record)
            for record in records
        ]
        
    async def get_job_record(self, job_project_id: str, job_name: str):

        record = await self.collection.find_one({
            "job_project_id": ObjectId(job_project_id) if isinstance(job_project_id, str) else job_project_id,
            "job_name": job_name,
        })

        if record:
            return JobScheme(**record)
        
        return None
