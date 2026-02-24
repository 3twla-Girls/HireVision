from DB.init_db import db
db.create_collection(
    "jobs",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["job_role", "experience_level", "req_skills"],
            "properties": {
                "job_role": {"bsonType": "string"},
                "experience_level": {"bsonType": "string"},
                "req_skills": {
                    "bsonType": "array",
                    "items": {"bsonType": "string"}
                }
            }
        }
    }
)
