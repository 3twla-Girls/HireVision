from pydantic import BaseModel, Field
from typing import Optional

class JobRequest(BaseModel):
    job_description: str = Field(..., min_length=10)
    job_title: Optional[str] = None
    required_skills: Optional[str] = None
    required_experience: Optional[str] = None
    required_education: Optional[str] = None
