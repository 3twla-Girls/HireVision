import json
import os
from groq import Groq
from dotenv import load_dotenv
import Question_Generation.models.model_factory as model_factory
from Question_Generation.utils.prompt_utils import SystemPromptCache
from Question_Generation.utils.schemas import QUESTION_SCHEMA

# DB repositories
from DB.repositories.job_repo import get_job_by_id
from DB.repositories.question_repo import save_generated_questions

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MINIFIED_QUESTION_SCHEMA = json.loads(
    json.dumps(QUESTION_SCHEMA, separators=(',', ':'))
)


def generate_questions_service(
    job_id: str,
    num_questions: int,
    model_key: str
) -> dict:
    """
    Generates interview questions using AI
    and stores them in MongoDB.
    """

    # 🔹 1. Get job data from DB
    job = get_job_by_id(job_id)

    if not job:
        return {"error": "Job not found"}

    job_title = job["job_role"]
    skills = job["req_skills"]
    experience_level = job["experience_level"]

    # 🔹 2. Load system prompt
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

            # 🔹 3. Save questions to DB via repository
            db_id = save_generated_questions(
                job_id=job_id,
                questions=result.get("questions", [])
            )

            result["db_id"] = db_id
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
        return {
            "questions": [],
            "error": f"API call failed: {str(e)}"
        }
