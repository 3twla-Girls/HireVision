"""
Model Selector Logic
Iterates through available models, generates questions using the QG controller,
and computes perplexity scores to rank them.
"""

import sys
import os
import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Add shared Metrics dir to path to import Perplexity scorer
sys.path.insert(0, str(Path(__file__).parent.parent))
# Add QG dir to path to import QG controller and ModelFactory
qg_path = Path(__file__).parent.parent.parent / "Question-Generation"
sys.path.insert(0, str(qg_path))

try:
    from Perplexity.perplexity_scorer import compute_perplexity
    from controllers.QuestionGeneration_controller import generate_questions_service
    from models.model_factory import ModelFactory
except Exception as e:
    print(f"Import Error: {e}")
    raise

# Load env and create Groq client for fallback calls
load_dotenv(dotenv_path=str(Path(__file__).parent.parent.parent / ".env"))
_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# System prompt for fallback (same as QG module)
_SYSTEM_PROMPT = (
    "You are a technical interviewer.\n"
    "Generate technical questions based on the user input (role, skills, experience, number).\n"
    "Use the output schema strictly. No soft skills, no behavioral questions, no coding tasks."
)

_QUESTION_SCHEMA = {
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
                "required": ["id", "type", "question"]
            }
        }
    },
    "required": ["questions"]
}


def _fallback_generate(job_title, skills, experience_level, num_questions, model_key):
    """
    Fallback question generation using json_object mode for models
    that don't support json_schema (e.g. llama).
    """
    model_id = ModelFactory.get_model(model_key)
    schema_instruction = (
        "\n\nYou MUST respond with valid JSON matching this schema:\n"
        + json.dumps(_QUESTION_SCHEMA)
    )
    user_prompt = (
        f"Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Level: {experience_level}\n"
        f"NumQ: {num_questions}"
    )

    completion = _client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT + schema_instruction},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )

    raw_output = completion.choices[0].message.content
    return json.loads(raw_output)


def evaluate_models(
    job_title: str,
    skills: list[str],
    experience_level: str,
    num_questions: int = 5
) -> list[dict]:
    """
    Test all available models and return their perplexity stats.
    """
    results = []
    
    # Get all available models from the factory
    available_models = list(ModelFactory.Models.keys())
    
    # Switch CWD to QG directory so the controller can find its prompt files
    original_cwd = os.getcwd()
    os.chdir(str(qg_path))
    
    try:
        for model_key in available_models:
            print(f"Evaluating model: {model_key}...")
            
            try:
                # 1. Generate questions using the QG controller
                q_result = generate_questions_service(
                    job_title=job_title,
                    skills=skills,
                    experience_level=experience_level,
                    num_questions=num_questions,
                    model_key=model_key
                )
                
                questions = [q.get("question", "") for q in q_result.get("questions", [])]
                
                # If json_schema failed, retry with json_object fallback
                if not questions:
                    print(f"  -> {model_key} failed with json_schema, trying json_object fallback...")
                    fallback_result = _fallback_generate(
                        job_title, skills, experience_level, num_questions, model_key
                    )
                    questions = [q.get("question", "") for q in fallback_result.get("questions", [])]
                
                # Still no questions after fallback
                if not questions:
                    print(f"  -> {model_key} returned no questions even with fallback")
                    results.append({
                        "model_key": model_key,
                        "mean_perplexity": 9999.0,
                        "perplexities": [],
                        "sample_questions": ["Error: No questions generated"]
                    })
                    continue
                
                # 2. Compute Perplexity
                ppl_result = compute_perplexity(
                    texts=questions,
                    model_id="gpt2-medium",
                    batch_size=4
                )
                
                mean_ppl = ppl_result["mean_perplexity"]
                
                results.append({
                    "model_key": model_key,
                    "mean_perplexity": mean_ppl,
                    "perplexities": ppl_result["perplexities"],
                    "sample_questions": questions[:3]
                })
                
            except Exception as e:
                print(f"Failed to evaluate {model_key}: {e}")
                results.append({
                    "model_key": model_key,
                    "mean_perplexity": 9999.0,
                    "perplexities": [],
                    "sample_questions": [f"Error: {str(e)}"]
                })
    finally:
        os.chdir(original_cwd)

    # Sort by mean perplexity (lower is better)
    results.sort(key=lambda x: x["mean_perplexity"])
    
    return results
