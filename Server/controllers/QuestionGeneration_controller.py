import requests
from bson import ObjectId
from fastapi import Response
from Server.config.database import db
from Server.config.settings import MODULE3_URL
from Server.models.question_schema import *
from Module_3.Question_Generation.routes.routes import generate_questions_with_answers
from Module_3.Question_Generation.models.job_info import JobInfo


async def generate_and_store(job_info: dict):

    # Convert dict → JobInfo model
    job_info_obj = JobInfo(**job_info)

    # Create dummy Response object
    response = Response()

    # Call Module-3 function
    data = await generate_questions_with_answers(job_info_obj, response)

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

    result = db.questions_with_answers.insert_one(document)

    return {
        "inserted_id": str(result.inserted_id),
        "job_id": str(new_job_id),
        "count": len(questions_with_answers),
    }