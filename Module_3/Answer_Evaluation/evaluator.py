import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
import os

# Load API key
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

from pathlib import Path

# Base path to access prompt files 
BASE_PATH = Path(__file__).parent / "prompts"

# Load prompts
PROMPT_SINGLE = (BASE_PATH / "prompt_per_question.txt").read_text()
PROMPT_SUMMARY = (BASE_PATH / "prompt_final_summary.txt").read_text()

MODEL_NAME = "openai/gpt-oss-120b"  #  Groq model 

def evaluate_single_answer(question, correct_answer, candidate_answer):
    """
    Evaluates one answer using Prompt A.
    Returns parsed JSON dictionary.
    """

    prompt = PROMPT_SINGLE.format(
        question=question,
        correct_answer=correct_answer,
        candidate_answer=candidate_answer
    )

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_output = response.choices[0].message.content

    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw": raw_output}

import json
import re

def clean_llm_json(text: str):
    text = text.strip()

    # Try to extract JSON from a ```json ... ``` code block anywhere in the text
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Fallback: find the first { ... } block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0).strip()

    return text


def generate_final_summary(evaluations_list):
    """
    Generates final overall summary using Prompt B.
    """

    eval_json_str = json.dumps(evaluations_list, indent=2)

    prompt = PROMPT_SUMMARY.replace("{evaluation_list}", eval_json_str)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_output = response.choices[0].message.content

    # ✅ clean the model output
    cleaned_output = clean_llm_json(raw_output)

    try:
        return json.loads(cleaned_output)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw": raw_output}