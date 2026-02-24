from DB.init_db import db
db.create_collection(
    "users",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "email"],
            "properties": {
                "name": {"bsonType": "string"},
                "email": {"bsonType": "string"},
                "user_interviews": {
                    "bsonType": "array",
                    "items": {"bsonType": "objectId"}
                }
            }
        }
    }
)
