from pydantic import BaseModel, Field, validator
from typing import Any, Optional, List
from datetime import datetime
from bson import ObjectId
from ...helpers.serialized import PyObjectId
from .JobScheme import JobScheme
class QuestionItem(BaseModel):
    question_id: PyObjectId = Field(default_factory=PyObjectId)
    type: str
    question: str
    options: List[str] = Field(default_factory=list)
    reference_answer: str

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    @validator("question_id", pre=True)
    def validate_question_id(cls, v):
        if v is None:
            return PyObjectId()
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

class QuestionGenerationScheme(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    job_id: PyObjectId
    is_mock: bool = False
    questions_w_answers: List[QuestionItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

    @validator("id", pre=True)
    def validate_id(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return PyObjectId(v)
        if isinstance(v, ObjectId):
            return PyObjectId(v)
        return v

    @validator("job_id", pre=True)
    def validate_job_id(cls, v):
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
                "key": [("job_id", 1)],
                "name": "job_id_index",
                "unique": False
            }
        ]

# def build_questions_with_answers_document(job_info: JobScheme, questions: list):
#     """
#     Utility to build the document for database insertion.
#     Using Pydantic model for consistency.
#     """
#     new_job_id = job_info.id
    
#     # Create instances of QuestionItem for each question
#     question_items = [
#         QuestionItem(
#             question_id=q.get("question_id", ObjectId()),
#             type=q["type"],
#             question=q["question"],
#             options=q.get("options", []),
#             reference_answer=q.get("reference_answer")
#         ) for q in questions
#     ]
    
#     schema_instance = QuestionGenerationScheme(
#         job_id=new_job_id,
#         questions_w_answers=question_items,
#         created_at=datetime.utcnow()
#     )
    
#     return schema_instance.dict(by_alias=True, exclude_none=True), new_job_id

def build_questions_with_answers_document(job_info: Any, questions: list, is_mock: bool = False):
    """
    Utility modified to handle both:
    1. Real Job (job_info is a JobScheme object)
    2. Mock Interview (job_info is just a string/ObjectId of the candidate)
    """
    # Determine target_id based on the type of job_info
    if hasattr(job_info, 'id'):
        target_id = job_info.id
    else:
        target_id = job_info # in case of mock, we expect job_info to be the candidate_id or job_id directly

    # Create instances of QuestionItem for each question
    question_items = [
        QuestionItem(
            question_id=q.get("question_id") if q.get("question_id") else ObjectId(),
            type=q.get("type", "technical"),
            question=q["question"],
            options=q.get("options", []),
            reference_answer=q.get("reference_answer")
        ) for q in questions
    ]
    
    schema_instance = QuestionGenerationScheme(
        job_id=target_id, 
        is_mock=is_mock,
        questions_w_answers=question_items,
        created_at=datetime.utcnow()
    )
    
    return schema_instance.dict(by_alias=True, exclude_none=True), target_id

