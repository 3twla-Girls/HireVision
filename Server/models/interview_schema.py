from Server.config.database import db

def apply_interview_session_schema():

    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "candidate_id",
                "job_id",
                "status",
                "questions",
                "created_at"
            ],
            "additionalProperties": False,
            "properties": {

                "candidate_id": {
                    "bsonType": "objectId"
                },

                "job_id": {
                    "bsonType": "objectId"
                },

                "status": {
                    "enum": [
                        "started",
                        "in_progress",
                        "completed",
                        "evaluated"
                    ]
                },

                "created_at": {
                    "bsonType": "date"
                },

                "updated_at": {
                    "bsonType": "date"
                },

                "questions": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": [
                            "ques_id"
                        ],
                        "additionalProperties": False,
                        "properties": {

                            "ques_id": {
                                "bsonType": "objectId"
                            },

                            "question_text": {
                                "bsonType": "string"
                            },

                            "user_answer": {
                                "bsonType": "string"
                            },

                            "score": {
                                "bsonType": "number"
                            },

                            "strengths": {
                                "bsonType": "string"
                            },

                            "weaknesses": {
                                "bsonType": "string"
                            },

                            "missing_points": {
                                "bsonType": "string"
                            }
                        }
                    }
                },

                "overall_feedback": {
                    "bsonType": "object",
                    "additionalProperties": False,
                    "properties": {

                        "overall_score": {
                            "bsonType": "number"
                        },

                        "summary": {
                            "bsonType": "string"
                        },

                        "recommendations": {
                            "bsonType": "string"
                        }
                    }
                }
            }
        }
    }

    try:
        db.create_collection("interview_sessions")
        print("interview_sessions collection created")

    except Exception:
        print("interview_sessions already exists")

    db.command({
        "collMod": "interview_sessions",
        "validator": validator,
        "validationLevel": "strict"
    })

    print("interview_sessions schema applied successfully")