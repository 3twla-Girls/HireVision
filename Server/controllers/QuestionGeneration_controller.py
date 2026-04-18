from typing import Union

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

    # async def generate_and_store(self, job_info: JobScheme) -> dict:

    #     # Create dummy Response object (if still required by the underlying route function)
    #     response = Response()

    #     # Call Module-3 function
    #     data = await generate_questions_with_answers(job_info, response)

    #     questions_with_answers = []

    #     for q in data.get("questions_with_answers", []):
    #         questions_with_answers.append({
    #             "question_id": ObjectId(),
    #             "type": q["type"],
    #             "question": q["question"],
    #             "options": q.get("options", []),
    #             "reference_answer": q.get("reference_answer")
    #         })

    #     # Build document
    #     document, new_job_id = build_questions_with_answers_document(
    #         job_info,
    #         questions_with_answers
    #     )

    #     result = await self.collection.insert_one(document)

    #     return {
    #         "inserted_id": str(result.inserted_id),
    #         "job_id": str(job_info.id),
    #         "count": len(questions_with_answers),
    #     }
        
    async def generate_and_store(self, job_info: Union[JobScheme, dict]) -> dict:
        try:
            #determining if it's a real job or a mock interview based on the type of job_info
            if isinstance(job_info, JobScheme):
                target_id = job_info.id
                is_mock = False
            else:
                #if it's a dict, we expect it to have the candidate_id and is_mock flag (for mock interviews)
                target_id = job_info.get("job_id") 
                is_mock = job_info.get("is_mock", False)

            # Create dummy Response object (if still required by the underlying route function)
            response = Response()

            # Call Module-3 function with the appropriate job_info format
            data = await generate_questions_with_answers(job_info, response)

            questions_with_answers = []
            for q in data.get("questions_with_answers", []):
                questions_with_answers.append({
                    "question_id": ObjectId(),
                    "type": q["type"],
                    "question": q["question"],
                    "options": q.get("options", []),
                    "reference_answer": q.get("reference_answer") or "",
                })

            # 4. Build document using the existing utility function, passing the target_id and is_mock flag
            document, _ = build_questions_with_answers_document(
                target_id, 
                questions_with_answers
            )
            
            #   Adding the is_mock flag to the document to differentiate between real job questions and mock interview questions
            document["is_mock"] = is_mock

            # 5. Insert into DB
            result = await self.collection.insert_one(document)

            return {
                "inserted_id": str(result.inserted_id),
                "target_id": str(target_id),
                "is_mock": is_mock,
                "count": len(questions_with_answers),
            }
            
        except Exception as e:
            logger.error(f"Error in generate_and_store: {e}")
            raise e
