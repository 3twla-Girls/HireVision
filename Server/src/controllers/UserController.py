from .BaseController import BaseController
from models.UserModel import UserModel
from models.db_schemes.User import (
    JobSeekerScheme,
    RecruiterScheme
)
from bson import ObjectId
import logging


logger = logging.getLogger("uvicorn.error")


class UserController(BaseController):

    def __init__(self):
        super().__init__()
        self.db_client = None
        self.user_model = None

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls()
        instance.db_client = db_client
        instance.user_model = await UserModel.create_instance(db_client)
        return instance

    # ===================================
    # Create Job Seeker
    # ===================================
    async def create_job_seeker(self, user_data: JobSeekerScheme):

        existing = await self.user_model.find_by_email(user_data.email)
        if existing:
            raise Exception("EMAIL_ALREADY_EXISTS")

        user_dict = user_data.model_dump()
        result = await self.user_model.create_user(user_dict)

        return str(result.inserted_id)

    # ===================================
    # Create Recruiter
    # ===================================
    async def create_recruiter(self, user_data: RecruiterScheme):

        existing = await self.user_model.find_by_email(user_data.email)
        if existing:
            raise Exception("EMAIL_ALREADY_EXISTS")

        user_dict = user_data.model_dump()
        result = await self.user_model.create_user(user_dict)

        return str(result.inserted_id)

    # ===================================
    # Get User
    # ===================================
    async def get_user(self, user_id: str):

        user = await self.user_model.find_by_id(ObjectId(user_id))
        if not user:
            raise Exception("USER_NOT_FOUND")

        user["_id"] = str(user["_id"])

        return user

    # ===================================
    # Get All By Role
    # ===================================
    async def get_users_by_role(self, role: str):

        users = await self.user_model.find_by_role(role)

        for user in users:
            user["_id"] = str(user["_id"])

        return users

    # ===================================
    # Update
    # ===================================
    async def update_user(self, user_id: str, update_data: dict):

        await self.user_model.update_user(
            ObjectId(user_id),
            update_data
        )

        return await self.get_user(user_id)

    # ===================================
    # Delete
    # ===================================
    async def delete_user(self, user_id: str):

        result = await self.user_model.delete_user(ObjectId(user_id))

        if result.deleted_count == 0:
            raise Exception("USER_NOT_FOUND")

        return True
