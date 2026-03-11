from pydantic import BaseModel, Field, validator
from typing import Optional, List, Union
from datetime import datetime
from ..enums.jobStatusEnum import JobStatus
from ..enums.jobTypeEnum import JobType
from ...helpers.serialized import PyObjectId
from bson import ObjectId


class JobScheme(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    job_title: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=10)

    required_skills: List[str] = Field(default_factory=list)
    required_experience: Optional[str] = None
    required_education: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    status: JobStatus = JobStatus.OPEN
    location: str
    job_type: JobType = JobType.PART_TIME
    cluster_id: Optional[int] = None
    job_recruiter_id: Optional[PyObjectId] = None
    num_questions:int
    number_of_questions_per_interview: int
    # -------------------------------------------------
    # Pydantic Config
    # -------------------------------------------------
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    # -------------------------------------------------
    # Validators: allow strings or ObjectId for PyObjectId fields
    # -------------------------------------------------
    @validator("id", pre=True)
    def validate_id(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

    @validator("job_recruiter_id", pre=True)
    def validate_recruiter_id(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

    # -------------------------------------------------
    # MongoDB Indexes
    # -------------------------------------------------
    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("job_recruiter_id", 1)],
                "name": "job_recruiter_id_index",
                "unique": False
            }
        ]