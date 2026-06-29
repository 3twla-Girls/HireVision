from .BaseDataModel import BaseDataModel
from bson import ObjectId


class UserModel(BaseDataModel):

    COLLECTION_NAME = "users"

    def __init__(self, db_client):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[self.COLLECTION_NAME]

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        collections = await self.db_client.list_collection_names()

        if self.COLLECTION_NAME not in collections:
            self.collection = self.db_client[self.COLLECTION_NAME]
            await self.collection.create_index("email", unique=True)
            await self.collection.create_index("role")

    async def insert_user(self, user_dict: dict):
        return await self.collection.insert_one(user_dict)

    async def find_by_email(self, email: str):
        return await self.collection.find_one({"email": email})
    
    async def find_by_email_password(self, email: str,password: str):
        return await self.collection.find_one({"email": email, "password": password})
    
    async def find_by_id(self, user_id):
        return await self.collection.find_one({"_id": user_id})

    async def update_user(self, user_id: ObjectId, update_data: dict):
        return await self.collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )

    async def delete_user(self, user_id: ObjectId):
        return await self.collection.delete_one({"_id": user_id})