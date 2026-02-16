from .BaseDataModel import BaseDataModel
from .db_schemes.User import UserBase
from .enums.DataBaseEnum import DataBaseEnum
from bson import ObjectId


class UserModel(BaseDataModel):

    def __init__(self, db_client):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_USER_NAME.value]

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()

        if DataBaseEnum.COLLECTION_USER_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_USER_NAME.value]

            indexes = UserBase.get_indexes()
            for index in indexes:
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"]
                )

    # ===============================
    # CRUD
    # ===============================

    async def create_user(self, user_dict: dict):
        return await self.collection.insert_one(user_dict)

    async def find_by_email(self, email: str):
        return await self.collection.find_one({"email": email})

    async def find_by_id(self, user_id: ObjectId):
        return await self.collection.find_one({"_id": user_id})

    async def find_by_role(self, role: str):
        return await self.collection.find({"role": role}).to_list(None)

    async def update_user(self, user_id: ObjectId, update_data: dict):
        return await self.collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )

    async def delete_user(self, user_id: ObjectId):
        return await self.collection.delete_one({"_id": user_id})
