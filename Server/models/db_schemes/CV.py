from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from bson.objectid import ObjectId
from datetime import datetime


class CV(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")

    # Existing fields
    cv_user_id: ObjectId
    cv_type: str = Field(..., min_length=1)
    cv_name: str = Field(..., min_length=1)
    cv_size: Optional[int] = Field(default=None, ge=0)
    cv_config: Optional[Dict[str, Any]] = Field(default=None)
    cv_pushed_at: datetime = Field(default_factory=datetime.utcnow)
    cv_text:str = Field(..., min_length=1)
    extracted_skills: Optional[List[str]] = None
    cluster_id: Optional[int] = None

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def get_indexes(cls):
        return [
            {"key": [("cv_user_id", 1)], "name": "cv_user_id_index_1", "unique": False},
            {"key": [("cv_user_id", 1), ("cv_name", 1)], "name": "cv_user_id_name_index_1", "unique": True},
            {"key": [("cluster_id", 1)], "name": "cluster_id_index_1", "unique": False},
        ]