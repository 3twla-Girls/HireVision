from .BaseController import BaseController
from ..models.UserModel import UserModel
from ..models.db_schemes.user import CreateUserScheme
from bson.objectid import ObjectId
from bson.errors import InvalidId
from datetime import datetime
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

    # =============================
    # Create User (Dynamic Role)
    # =============================
    async def create_user(self, user_data: CreateUserScheme):
        user_dict = user_data.model_dump()

        # Check existing email
        existing = await self.user_model.find_by_email(user_dict["email"])
        if existing:
            raise Exception("USER_ALREADY_EXISTS")

        role = user_dict.get("role")

        if role not in ["jobseeker", "recruiter"]:
            raise Exception("INVALID_ROLE")

        if role == "recruiter" and not user_dict.get("company_name"):
            raise Exception("COMPANY_NAME_REQUIRED")

        return await self.user_model.insert_user(user_dict)

    # =============================
    # Get User
    # =============================
    @staticmethod
    def serialize_mongo_doc(doc: dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, datetime):
                new_doc[k] = v.isoformat()  # converts datetime to ISO string
            else:
                new_doc[k] = v
        return new_doc
    
    
    async def get_user(self, user_id: str):
        try:
            oid = ObjectId(user_id)
            user = await self.user_model.find_by_id(oid)
        except InvalidId:
            oid = None
            user = None

        if not user:
            user = await self.user_model.find_by_id(user_id)

        if not user:
            raise Exception("USER_NOT_FOUND")

        # Convert ObjectId and datetime fields
        user = UserController.serialize_mongo_doc(user)

        return user
    
    
    async def get_user_email_password(self, email: str, password: str):
        user = await self.user_model.find_by_email_password(email, password)
        if not user:
            raise Exception("USER_NOT_FOUND")

        # Convert ObjectId and datetime fields
        user = UserController.serialize_mongo_doc(user)

        return user 
    # =============================
    # Update User
    # =============================
    async def update_user(self, user_id: str, update_data: dict):
        await self.user_model.update_user(
            ObjectId(user_id),
            update_data
        )
        return await self.get_user(user_id)

    # =============================
    # Delete User
    # =============================
    async def delete_user(self, user_id: str):
        result = await self.user_model.delete_user(ObjectId(user_id))

        if result.deleted_count == 0:
            raise Exception("USER_NOT_FOUND")

        return True
    
    async def delete_jobs_by_recruiter(self, recruiter_id: str):
        result = await self.job_model.delete_by_recruiter(
            ObjectId(recruiter_id)
        )

        return result.deleted_count