import json
from groq import Groq
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import models.model_factory as model_factory

load_dotenv()  
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_questions_service(job_title, skills, experience_level, num_questions, model_key):
    
    # 1. Load prompt file
    with open("prompts/QuestionGeneration_template.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()
    
    
    final_prompt = prompt_template.format(
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
        num_questions=num_questions
    )

    # 3. Call Groq LLaMA model
    completion = client.chat.completions.create(
        model=model_factory.ModelFactory.get_model(model_key),
        messages=[
            {
                "role": "user",
                "content": final_prompt
            }
        ],
        temperature=0.1
    )

    raw_output = completion.choices[0].message.content

    try:
        result = json.loads(raw_output)
    except Exception:
        result = {"questions": [], "raw_output": raw_output}

    return result
