from Server.config.database import db
db.create_collection(
    "questions_with_answers",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["job_id", "questions_w_answers"],
            "properties": {
                "job_id": {"bsonType": "objectId"},
                "questions_w_answers": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["question_id", "type", "question", "reference_answer"],
                        "properties": {
                            "question_id": {"bsonType": "objectId"},
                            "type": {"bsonType": "string"},
                            "question": {"bsonType": "string"},
                            "options": {
                                "bsonType": "array",
                                "items": {"bsonType": "string"}
                            },
                            "reference_answer": {"bsonType": "string"}
                        }
                    }
                }
            }
        }
    }
)