from pydantic import BaseModel, Field
from typing import Optional, List
from bson.objectid import ObjectId
from datetime import datetime

class JobScheme(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    job_title: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=10)
    # required_skills: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    required_experience: Optional[str] = None
    required_education: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    applicants: List[str] = Field(default_factory=list)
    job_project_id: Optional[ObjectId] = None
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True
    }

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("job_project_id", 1)],
                "name": "job_project_id_index",
                "unique": False
            }
        ]
