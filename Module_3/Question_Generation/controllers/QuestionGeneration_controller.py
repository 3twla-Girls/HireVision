import json
import os
from groq import Groq
from dotenv import load_dotenv
import Module_3.Question_Generation.models.model_factory as model_factory
from Module_3.Question_Generation.utils.prompt_utils import SystemPromptCache


load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_questions_service(
    job_title: str,
    skills: list[str],
    experience_level: str,
    num_questions: int,
    model_key: str
) -> dict:
    """
    Generate interview questions using Groq LLM.
    Returns:
        {
            "questions": [...],
            "token_usage": {...},
            "error": optional
        }
    """

    system_prompt = SystemPromptCache.load(
        "prompts/QuestionGeneration_system.txt"
    )

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
            response_format={"type": "json_object"},
            temperature=0.1
        )

        raw_output = completion.choices[0].message.content

        token_usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens
        }

        # Parse JSON safely
        try:
            result = json.loads(raw_output)

        except json.JSONDecodeError as e:
            return {
                "questions": [],
                "token_usage": token_usage,
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output
            }

        # Validate structure
        if "questions" not in result or not isinstance(result["questions"], list):
            return {
                "questions": [],
                "token_usage": token_usage,
                "error": "Invalid response structure: missing 'questions' array",
                "raw_output": raw_output
            }

        validated_questions = []

        required_keys = {"id", "type", "question"}

        for q in result["questions"]:
            if not required_keys.issubset(q.keys()):
                return {
                    "questions": [],
                    "token_usage": token_usage,
                    "error": "Invalid question format from model",
                    "raw_output": raw_output
                }

            validated_questions.append({
                "id": str(q["id"]),
                "type": q["type"],
                "question": q["question"],
                "options": q.get("options", [])
            })

        return {
            "questions": validated_questions,
            "token_usage": token_usage
        }

    except Exception as e:
        return {
            "questions": [],
            "token_usage": {},
            "error": f"LLM API call failed: {str(e)}"
        }