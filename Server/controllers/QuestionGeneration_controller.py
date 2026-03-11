import requests
import logging
from bson import ObjectId
from fastapi import Response
from .BaseController import BaseController
from ..models.enums.DataBaseEnum import DataBaseEnum
from ..models.db_schemes.question_schema import *
from Module_3.Question_Generation.routes.routes import generate_questions_with_answers
from Module_3.Question_Generation.models.job_info import JobInfo
from ..models.db_schemes.JobScheme import JobScheme
logger = logging.getLogger('uvicorn.error')

class QuestionGenerationController(BaseController):

    def __init__(self, db_client=None):
        super().__init__()
        self.db_client = db_client
        self.collection = None

    @classmethod
    async def create_instance(cls, db_client):
        instance = cls(db_client=db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        self.collection = self.db_client[DataBaseEnum.COLLECTION_QUESTIONS_WITH_ANSWERS_NAME.value]
        # Note: If there are indexes for this collection, they should be initialized here like in ApplicationController.

    async def generate_and_store(self, job_info: JobScheme) -> dict:

        # Create dummy Response object (if still required by the underlying route function)
        response = Response()

        # Call Module-3 function
        data = await generate_questions_with_answers(job_info, response)

        questions_with_answers = []

        for q in data.get("questions_with_answers", []):
            questions_with_answers.append({
                "question_id": ObjectId(),
                "type": q["type"],
                "question": q["question"],
                "options": q.get("options", []),
                "reference_answer": q.get("reference_answer")
            })

        # Build document
        document, new_job_id = build_questions_with_answers_document(
            job_info,
            questions_with_answers
        )

        result = await self.collection.insert_one(document)

        return {
            "inserted_id": str(result.inserted_id),
            "job_id": str(job_info.id),
            "count": len(questions_with_answers),
        }
