from Question_Generation.utils.prompt_utils import SystemPromptCache
from Question_Generation.utils.schemas import REFERENCE_ANSWER_SCHEMA
from groq import Groq
import os
from dotenv import load_dotenv
import Question_Generation.models.model_factory as model_factory
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent 
PROMPT_FILE_PATH = BASE_DIR / "prompts" / "ReferenceAnswer_system.txt"

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MINIFIED_REFERENCE_ANSWER_SCHEMA = json.loads(
    json.dumps(REFERENCE_ANSWER_SCHEMA, separators=(',', ':'))
)


def generate_answers_service(job_title, skills, experience_level, questions, model_key):
    
    system_prompt = SystemPromptCache.load(str(PROMPT_FILE_PATH))
    
    user_prompt = (
        f"Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Level: {experience_level}\n\n"
        f"Questions:\n{questions}"
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
                    "name": "ReferenceAnswers",
                    "schema": MINIFIED_REFERENCE_ANSWER_SCHEMA
                }
            },
            temperature=0.1
        )

        raw_output = completion.choices[0].message.content

        # Extract token usage here
        token_usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens
        }

        try:
            result = json.loads(raw_output)
            result["token_usage"] = token_usage  # attach token usage
            return result
        
        except json.JSONDecodeError as e:
            return {
                "answers": [],
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output,
                "token_usage": token_usage
            }

    except Exception as e:
        return {"answers": [], "error": f"API call failed: {str(e)}"}
