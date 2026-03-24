from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreateUserScheme(BaseModel):
    email: str
    name: str
    password: str
    role: str  # "jobseeker" | "recruiter"

    profile_image_url: Optional[str] = None
    profile_image_public_id: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    # ---------------- JobSeeker fields ----------------
    education: Optional[str] = None
    date_of_birth: Optional[datetime] = None  # ✅ Added
    # ---------------- Recruiter fields ----------------
    company_name: Optional[str] = None
    company_web_link: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "arbitrary_types_allowed": True
    }


class UpdateUserScheme(BaseModel):
    name: Optional[str] = None

    # ---------------- JobSeeker fields ----------------
    education: Optional[str] = None
    date_of_birth: Optional[datetime] = None  # ✅ Added

    # ---------------- Recruiter fields ----------------
    company_name: Optional[str] = None
    company_web_link: Optional[str] = None