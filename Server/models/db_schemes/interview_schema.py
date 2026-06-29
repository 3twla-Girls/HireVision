from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from ...helpers.serialized import PyObjectId

class InterviewQuestion(BaseModel):
    ques_id: PyObjectId = Field(default_factory=PyObjectId)
    question_text: Optional[str] = None
    user_answer: Optional[str] = None
    score: Optional[float] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    missing_points: Optional[str] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    @validator("ques_id", pre=True)
    def validate_ques_id(cls, v):
        if v is None:
            return PyObjectId()
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

class InterviewScheme(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    candidate_id: PyObjectId
    # job_id: PyObjectId
    job_id: Optional[PyObjectId] = None
   
    job_title: Optional[str] = None
    status: str = "started"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    questions: List[InterviewQuestion] = Field(default_factory=list)
    overall_feedback: Optional[Dict[str, Any]] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    }

    @validator("id", "candidate_id", "job_id", pre=True)
    def validate_object_ids(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("candidate_id", 1)],
                "name": "candidate_id_index",
                "unique": False
            },
            {
                "key": [("job_id", 1)],
                "name": "job_id_index",
                "unique": False
            }
        ]
