"""
Self-contained answer generator — calls Groq API directly to generate
answers for questions from the dataset.

Uses the EXACT same model, schema, and prompt as the original
AnswerGeneration_controller.py in Question-Generation module.
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load .env from Module-3 root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── System prompt with explicit JSON format instructions ──────
SYSTEM_PROMPT = (
    "You are an expert technical interviewer.\n"
    "\n"
    "Generate reference answers for technical questions:\n"
    "\n"
    "- Adjust detail by experience level (Junior/Mid/Senior).\n"
    "- MCQs: return only the correct option (e.g., \"B\"), no explanation.\n"
    "- Conceptual/Short-answer: give clear, accurate, detailed answers.\n"
    "- No extra text, preamble, or soft/behavioral content.\n"
    "- Answers must be concise but technically correct.\n"
    "\n"
    "You MUST respond with valid JSON in the following format:\n"
    '{\n'
    '  "answers": [\n'
    '    {\n'
    '      "question_id": 1,\n'
    '      "question_type": "mcq" | "conceptual" | "short",\n'
    '      "reference_answer": "..."\n'
    '    }\n'
    '  ]\n'
    '}\n'
    "- Do not include any text outside the JSON object.\n"
)

# ── Model (reads from .env, falls back to gpt-oss-120b) ──
MODEL = os.getenv("ACTIVE_MODEL", "openai/gpt-oss-120b")


def generate_answers(
    questions: list[str],
    job_title: str = "Software Engineer",
    skills: list[str] | None = None,
    experience_level: str = "Mid",
) -> list[dict]:
    """
    Generate LLM answers for a list of plain question strings.
    Uses the same Groq call, model, schema, and prompt as the original.

    Returns:
        list of {"question": str, "generated_answer": str}
    """
    if not questions:
        return []

    skills = skills or []

    # Format questions exactly like the original controller
    formatted_questions = [
        {"id": i + 1, "question": q, "type": "conceptual"}
        for i, q in enumerate(questions)
    ]

    user_prompt = (
        f"Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Level: {experience_level}\n\n"
        f"Questions:\n{formatted_questions}"
    )

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        raw_output = completion.choices[0].message.content

        try:
            result = json.loads(raw_output)
            answers_list = result.get("answers", [])
        except json.JSONDecodeError:
            answers_list = []

        # Map back to questions
        output = []
        for i, q in enumerate(questions):
            matched = next(
                (a for a in answers_list if a.get("question_id") == i + 1),
                None
            )
            output.append({
                "question": q,
                "generated_answer": matched["reference_answer"] if matched else "",
            })

        return output

    except Exception as e:
        return [
            {"question": q, "generated_answer": ""}
            for q in questions
        ]
