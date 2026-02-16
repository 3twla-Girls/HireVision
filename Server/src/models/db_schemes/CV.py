from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from datetime import datetime


class CVScheme(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")

    candidate_id: ObjectId
    project_id: ObjectId

    candidate_CV_link: str

    cv_embedding: List[float] = Field(default_factory=list)
    extracted_skills: List[str] = Field(default_factory=list)

    embedding_skills: List[List[float]] = Field(default_factory=list)
    embedding_education: List[float] = Field(default_factory=list)

    cluster_id: Optional[int] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True
    }

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("candidate_id", 1)],
                "name": "candidate_id_index",
                "unique": False
            },
            {
                "key": [("project_id", 1)],
                "name": "project_id_index",
                "unique": False
            },
            {
                "key": [("cluster_id", 1)],
                "name": "cluster_id_index",
                "unique": False
            }
        ]
