from Server.config.database import db
db.create_collection(
    "interview_sessions",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["candidate_id", "job_id", "status"],
            "properties": {
                "candidate_id": {"bsonType": "objectId"},
                "job_id": {"bsonType": "objectId"},
                "status": {"bsonType": "string"},

                "chosen_ques_keys": {
                    "bsonType": "array",
                    "items": {"bsonType": "objectId"}
                },

                "user_answers": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["ques_id", "user_answer"],
                        "properties": {
                            "ques_id": {"bsonType": "objectId"},
                            "user_answer": {"bsonType": "string"}
                        }
                    }
                },

                "per_question_evaluation": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["ques_id", "score"],
                        "properties": {
                            "ques_id": {"bsonType": "objectId"},
                            "score": {"bsonType": "number"},
                            "strengths": {"bsonType": "string"},
                            "weaknesses": {"bsonType": "string"},
                            "missing_points": {"bsonType": "string"}
                        }
                    }
                },

                "user_overall_feedback": {
                    "bsonType": "object",
                    "properties": {
                        "overall_score": {"bsonType": "number"},
                        "summary": {"bsonType": "string"},
                        "recommendations": {"bsonType": "string"}
                    }
                }
            }
        }
    }
)