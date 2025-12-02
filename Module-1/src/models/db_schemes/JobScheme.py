from pydantic import BaseModel, Field
from typing import Optional
from bson.objectid import ObjectId
from datetime import datetime

class JobScheme(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    job_title: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=10)
    required_skills: Optional[str] = None
    required_experience: Optional[str] = None
    required_education: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("job_project_id", 1)],
                "name": "job_project_id_index",
                "unique": False
            }
        ]
