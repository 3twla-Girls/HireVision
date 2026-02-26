import requests
from bson import ObjectId
from Server.config.database import db
from Server.config.settings import MODULE3_URL
from Server.models.question_schema import *


def generate_and_store(job_info: dict):

    # Call Module-3
    response = requests.post(
        f"{MODULE3_URL}/generate-questions-with-answers",
        json=job_info
    )

    if response.status_code != 200:
        raise Exception(
            f"Module-3 failed: {response.status_code} - {response.text}"
        )

    data = response.json()

    questions_with_answers = []

    for q in data.get("questions_with_answers", []):
        questions_with_answers.append({
            "question_id": ObjectId(),
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", []),
            "reference_answer": q.get("reference_answer")
        })

    # Build document using model layer
    document, new_job_id = build_questions_with_answers_document(
        job_info,
        questions_with_answers
    )

    result = db.questions_with_answers.insert_one(document)

    return {
        "inserted_id": str(result.inserted_id),
        "job_id": str(new_job_id),
        "count": len(questions_with_answers)
    }