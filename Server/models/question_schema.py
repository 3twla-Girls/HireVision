from Server.config.database import db
from bson import ObjectId
from datetime import datetime

def apply_questions_with_answers_schema():

    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["job_id", "questions_w_answers", "created_at"],
            "additionalProperties": False,
            "properties": {

                "job_id": {
                    "bsonType": "objectId"
                },

                "created_at": {
                    "bsonType": "date"
                },

                "questions_w_answers": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": [
                            "question_id",
                            "type",
                            "question",
                            "reference_answer"
                        ],
                        "additionalProperties": False,
                        "properties": {

                            "question_id": {
                                "bsonType": "objectId"
                            },

                            "type": {
                                "bsonType": "string"
                            },

                            "question": {
                                "bsonType": "string"
                            },

                            "options": {
                                "bsonType": "array",
                                "items": {
                                    "bsonType": "string"
                                }
                            },

                            "reference_answer": {
                                "bsonType": "string"
                            }
                        }
                    }
                }
            }
        }
    }

    try:
        db.create_collection("questions_with_answers")
        print("Collection created successfully")

    except Exception:
        print("Collection already exists")

    # Apply / update validator safely
    db.command({
        "collMod": "questions_with_answers",
        "validator": validator,
        "validationLevel": "strict"
    })

    print("Schema applied successfully")


def build_questions_with_answers_document(job_info: dict, questions: list):

    new_job_id = ObjectId()

    return {
        "job_id": new_job_id,
        "questions_w_answers": questions,
        "created_at": datetime.utcnow()
    }, new_job_id
