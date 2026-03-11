from Server.config.database import db

db.create_collection(
    "interview_sessions",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "candidate_id",
                "session_date",
                "answers"
            ],
            "properties": {

                "candidate_id": {
                    "bsonType": "string"
                },

                "session_date": {
                    "bsonType": "date"
                },

                "answers": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": [
                            "question_id",
                            "speech_to_text",
                            "evaluation"
                        ],
                        "properties": {

                            "question_id": {
                                "bsonType": "objectId",
                                "description": "Reference to question"
                            },

                            "speech_to_text": {
                                "bsonType": "string",
                                "description": "Output of Speech-to-Text module"
                            },

                            "evaluation": {
                                "bsonType": "object",
                                "required": [
                                    "score",
                                    "strengths",
                                    "weaknesses",
                                    "missing_points",
                                    "overall_feedback"
                                ],
                                "properties": {

                                    "score": {
                                        "bsonType": "int",
                                        "minimum": 0,
                                        "maximum": 10
                                    },

                                    "strengths": {
                                        "bsonType": "array",
                                        "items": {"bsonType": "string"}
                                    },

                                    "weaknesses": {
                                        "bsonType": "array",
                                        "items": {"bsonType": "string"}
                                    },

                                    "missing_points": {
                                        "bsonType": "array",
                                        "items": {"bsonType": "string"}
                                    },

                                    "overall_feedback": {
                                        "bsonType": "string"
                                    }
                                }
                            }
                        }
                    }
                },

                "final_summary": {
                    "bsonType": "object",
                    "properties": {

                        "final_score": {"bsonType": "double"},

                        "overall_strengths": {
                            "bsonType": "array",
                            "items": {"bsonType": "string"}
                        },

                        "overall_weaknesses": {
                            "bsonType": "array",
                            "items": {"bsonType": "string"}
                        },

                        "skill_assessment": {
                            "bsonType": "object"
                        },

                        "summary_for_recruiter": {"bsonType": "string"},

                        "tips_for_candidate": {"bsonType": "string"}
                    }
                }
            }
        }
    }
)