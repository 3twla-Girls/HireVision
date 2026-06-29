from pydantic import BaseModel
from typing import List

class MatchingUpdateRequest(BaseModel):
    score: float
    matched_skills: List[str]
    missing_skills: List[str]