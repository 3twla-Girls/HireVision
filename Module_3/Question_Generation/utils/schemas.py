import json

QUESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "type": {"type": "string", "enum": ["conceptual", "mcq", "short"]},
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["id", "type", "question", "options"]
            }
        }
    },
    "required": ["questions"]
}

REFERENCE_ANSWER_SCHEMA = {
    "type": "object",
    "properties": {
        "answers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question_id": {"type": "integer"},
                    "question_type": {"type": "string", "enum": ["mcq", "conceptual", "short"]},
                    "reference_answer": {"type": "string"}
                },
                "required": ["question_id", "question_type", "reference_answer"]
            }
        }
    },
    "required": ["answers"]
}
