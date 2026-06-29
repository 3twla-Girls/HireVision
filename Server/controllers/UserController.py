from .BaseController import BaseController
from ..models.UserModel import UserModel
from ..models.db_schemes.user import CreateUserScheme

from bson.objectid import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta

from passlib.context import CryptContext
from jose import jwt, JWTError

import logging

logger = logging.getLogger("uvicorn.error")

# =============================
# 🔐 Security Config
# =============================
SECRET_KEY = "your_super_secret_key"  # ⚠️ move to env later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
    # Password Utils
    # =============================
    def hash_password(self, password: str):
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str):
        return pwd_context.verify(plain_password, hashed_password)

    # =============================
    # JWT Utils
    # =============================
    def create_access_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})

        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return token

    def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            raise Exception("INVALID_TOKEN")

    # =============================
    # Create User
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

        # Hash password
        user_dict["password"] = self.hash_password(user_dict["password"])

        result = await self.user_model.insert_user(user_dict)

        user_id = str(result.inserted_id)

        # Create token
        token = self.create_access_token({
            "user_id": user_id,
            "email": user_dict["email"],
            "role": role
        })

        return {
            "user_id": user_id,
            "access_token": token
        }

    # =============================
    # Login
    # =============================
    async def login(self, email: str, password: str):
        user = await self.user_model.find_by_email(email)

        if not user:
            raise Exception("INVALID_CREDENTIALS")

        if not self.verify_password(password, user["password"]):
            raise Exception("INVALID_CREDENTIALS")

        user = self.serialize_mongo_doc(user)

        # Generate token
        token = self.create_access_token({
            "user_id": user["_id"],
            "email": user["email"],
            "role": user["role"]
        })

        return {
            "user": user,
            "access_token": token
        }

    # =============================
    # Serialize Mongo Doc
    # =============================
    @staticmethod
    def serialize_mongo_doc(doc: dict):
        new_doc = {}
        for k, v in doc.items():

            if k == "password":
                continue  # NEVER return password

            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, datetime):
                new_doc[k] = v.isoformat()
            else:
                new_doc[k] = v

        return new_doc

    # =============================
    # Get User
    # =============================
    async def get_user(self, user_id: str):
        try:
            oid = ObjectId(user_id)
            user = await self.user_model.find_by_id(oid)
        except InvalidId:
            user = None

        if not user:
            raise Exception("USER_NOT_FOUND")

        return self.serialize_mongo_doc(user)

    # =============================
    # Update User
    # =============================
    async def update_user(self, user_id: str, update_data: dict):

        if "password" in update_data:
            update_data["password"] = self.hash_password(update_data["password"])

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

    # =============================
    # Extract Current User from Token
    # =============================
    async def get_current_user(self, token: str):
        payload = self.verify_token(token)

        user_id = payload.get("user_id")

        if not user_id:
            raise Exception("INVALID_TOKEN")

        return await self.get_user(user_id)