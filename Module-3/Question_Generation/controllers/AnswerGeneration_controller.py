from utils.prompt_utils import SystemPromptCache
from groq import Groq
import os
from dotenv import load_dotenv
import models.model_factory as model_factory
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_answers_service(job_title, skills, experience_level, questions, model_key):
    
    system_prompt = SystemPromptCache.load("prompts/ReferenceAnswer_system.txt")
    
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
            response_format={"type": "json_object"},
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

            # Validate expected structure
            if "answers" not in result or not isinstance(result["answers"], list):
                return {
                    "answers": [],
                    "error": "Invalid response structure: missing 'answers' array",
                    "raw_output": raw_output,
                    "token_usage": token_usage
                }
            
            required_keys = {"question_id", "question_type", "reference_answer"}
            for a in result["answers"]:
                if not required_keys.issubset(a.keys()):
                    return {
                        "answers": [],
                        "error": f"Invalid answer format: missing keys {required_keys - a.keys()}",
                        "raw_output": raw_output,
                        "token_usage": token_usage
                    }

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