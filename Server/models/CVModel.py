from .BaseDataModel import BaseDataModel
from .db_schemes import CV
from .enums.DataBaseEnum import DataBaseEnum
from bson import ObjectId

class CVModel(BaseDataModel):

    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_CV_NAME.value]

    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_CV_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_CV_NAME.value]
            indexes = CV.get_indexes()
            for index in indexes:
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"]
                )

    async def create_cv(self, cv: CV):

        result = await self.collection.insert_one(cv.dict(by_alias=True, exclude_unset=True))
        cv.id = result.inserted_id

        return cv

    async def get_all_user_cvs(self, cv_user_id: str):

        records = await self.collection.find({
            "cv_user_id": ObjectId(cv_user_id) if isinstance(cv_user_id, str) else cv_user_id
        }).to_list(length=None)

        return [
            CV(**record)
            for record in records
        ]

    async def get_cv_record(self, cv_user_id: str, cv_name: str):

        record = await self.collection.find_one({
            "cv_user_id": ObjectId(cv_user_id) if isinstance(cv_user_id, str) else cv_user_id,
            "cv_name": cv_name,
        })

        if record:
            return CV(**record)
        
        return None
    
    async def delete_cv_by_id(self, cv_id: str):
        """
        Delete a single cv by its MongoDB ObjectId
        """
        result = await self.collection.delete_one({"_id": ObjectId(cv_id)})
        return result.deleted_count > 0

    async def delete_all_user_cvs(self, cv_user_id: str):
        """
        Delete all CVs that belong to a specific user
        """

        result = await self.collection.delete_many({
        "cv_user_id": ObjectId(cv_user_id)
        if isinstance(cv_user_id, str)
        else cv_user_id
        })

        return result.deleted_count
    
