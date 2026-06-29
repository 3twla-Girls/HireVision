import json
import os
from groq import Groq
from dotenv import load_dotenv
import Module_3.Question_Generation.models.model_factory as model_factory
from Module_3.Question_Generation.utils.prompt_utils import SystemPromptCache


load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def generate_answers_service(
    job_title: str,
    skills: list[str],
    experience_level: str,
    questions: list,
    model_key: str
) -> dict:
    """
    Generate reference answers for given questions.
    Returns:
        {
            "answers": [...],
            "token_usage": {...},
            "error": optional
        }
    """

    system_prompt = SystemPromptCache.load(
        "prompts/ReferenceAnswer_system.txt"
    )

    user_prompt = (
        f"Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Level: {experience_level}\n\n"
        f"Questions:\n{json.dumps(questions, indent=2)}"
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
                "answers": [],
                "token_usage": token_usage,
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output
            }

        # Validate structure
        if "answers" not in result or not isinstance(result["answers"], list):
            return {
                "answers": [],
                "token_usage": token_usage,
                "error": "Invalid response structure: missing 'answers' array",
                "raw_output": raw_output
            }

        validated_answers = []

        required_keys = {"question_id", "question_type", "reference_answer"}

        for a in result["answers"]:
            if not required_keys.issubset(a.keys()):
                return {
                    "answers": [],
                    "token_usage": token_usage,
                    "error": "Invalid answer format from model",
                    "raw_output": raw_output
                }

            validated_answers.append({
                "question_id": str(a["question_id"]),
                "question_type": a["question_type"],
                "reference_answer": a["reference_answer"]
            })

        return {
            "answers": validated_answers,
            "token_usage": token_usage
        }

    except Exception as e:
        return {
            "answers": [],
            "token_usage": {},
            "error": f"LLM API call failed: {str(e)}"
        }