from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from bson import ObjectId
from datetime import datetime


# ===============================
# Base User
# ===============================
class UserBase(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")

    email: EmailStr
    name: str
    password: str
    role: Literal["job_seeker", "recruiter"]

    img_link: Optional[str] = None
    join_time: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True
    }

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("email", 1)],
                "name": "email_unique_index",
                "unique": True
            },
            {
                "key": [("role", 1)],
                "name": "role_index",
                "unique": False
            }
        ]


# ===============================
# Job Seeker (inherits User)
# ===============================
class JobSeekerScheme(UserBase):
    role: Literal["job_seeker"] = "job_seeker"

    resumes: List[str] = Field(default_factory=list)
    date_of_birth: Optional[datetime] = None
    education: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None

    applications: List[ObjectId] = Field(default_factory=list)


# ===============================
# Recruiter (inherits User)
# ===============================
class RecruiterScheme(UserBase):
    role: Literal["recruiter"] = "recruiter"

    company_name: str
    company_web_link: Optional[str] = None
    jobs: List[ObjectId] = Field(default_factory=list)
