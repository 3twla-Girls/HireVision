from fastapi import APIRouter
from pydantic import BaseModel

class JobInfo(BaseModel):
    job_title: str
    skills: list
    experience_level: str
    num_questions: int


class AnswerGenerationRequest(BaseModel):
    job_title: str
    skills: list
    experience_level: str
    questions: list
