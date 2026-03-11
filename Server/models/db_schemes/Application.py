from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from ..enums.ApplicationEnum import ApplicationStatusEnum


class Application(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(alias="_id", default=None)
    job_id: str
    candidate_id: str
    candidate_cv_id: str
    years_of_exp: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: ApplicationStatusEnum = ApplicationStatusEnum.PENDING
    matching_score: Optional[float] = Field(default=None)
    matching_skills: Optional[List[str]] = Field(default=None)
    missing_skills: Optional[List[str]] = Field(default=None)
    cv_feedback_url: Optional[str] = Field(default=None)
    cv_feedback_public_id: Optional[str] = Field(default=None)
    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("job_id", 1), ("candidate_id", 1), ("candidate_cv_id", 1)],
                "name": "job_candidate_cv_unique",
                "unique": True
            }
        ]