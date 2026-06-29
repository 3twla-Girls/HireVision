from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from ...helpers.serialized import PyObjectId

class Evaluation(BaseModel):
    score: int = Field(..., ge=0, le=10)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_points: List[str] = Field(default_factory=list)
    overall_feedback: str

class Answer(BaseModel):
    question_id: PyObjectId
    speech_to_text: str
    evaluation: Evaluation

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    @validator("question_id", pre=True)
    def validate_question_id(cls, v):
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

class InterviewSessionScheme(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    candidate_id: PyObjectId
    session_date: datetime = Field(default_factory=datetime.utcnow)
    answers: List[Answer] = Field(default_factory=list)
    final_summary: Optional[Dict[str, Any]] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    @validator("id", "candidate_id", pre=True)
    def validate_object_ids(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v
