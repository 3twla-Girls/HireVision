import json
from groq import Groq
from dotenv import load_dotenv
import os
import models.model_factory as model_factory
from utils.prompt_utils import SystemPromptCache
from utils.schemas import QUESTION_SCHEMA

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MINIFIED_QUESTION_SCHEMA = json.loads(
    json.dumps(QUESTION_SCHEMA, separators=(',', ':'))
)


def generate_questions_service(
    job_title: str, 
    skills: list[str], 
    experience_level: str, 
    num_questions: int, 
    model_key: str
) -> dict:

    system_prompt = SystemPromptCache.load("prompts/QuestionGeneration_system.txt")
    
    user_prompt = (
        f"Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Level: {experience_level}\n"
        f"NumQ: {num_questions}"
    )

    try:
        completion = client.chat.completions.create(
            model=model_factory.ModelFactory.get_model(model_key),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "InterviewQuestions",
                    "schema": MINIFIED_QUESTION_SCHEMA
                }
            },
            temperature=0.1
        )

        raw_output = completion.choices[0].message.content

        token_usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens
        }

        try:
            result = json.loads(raw_output)
            result["token_usage"] = token_usage  
            return result
        
        except json.JSONDecodeError as e:
            return {
                "questions": [],
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output,
                "token_usage": token_usage
            }

    except Exception as e:
        return {"questions": [], "error": f"API call failed: {str(e)}"}
