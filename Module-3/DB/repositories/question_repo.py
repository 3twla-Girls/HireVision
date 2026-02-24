from DB.config.database import questions_collection
from bson import ObjectId


def save_generated_questions(job_id: str, questions: list):
    # assign ObjectId for each question
    for q in questions:
        q["question_id"] = ObjectId()

    document = {
        "job_id": ObjectId(job_id),
        "questions_w_answers": questions
    }

    result = questions_collection.insert_one(document)
    return str(result.inserted_id)


def update_reference_answers(job_id: str, answers: list):
    doc = questions_collection.find_one({"job_id": ObjectId(job_id)})

    if not doc:
        return None

    questions = doc["questions_w_answers"]

    for q, a in zip(questions, answers):
        q["reference_answer"] = a.get("reference_answer", "")

    questions_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"questions_w_answers": questions}}
    )

    return str(doc["_id"])
