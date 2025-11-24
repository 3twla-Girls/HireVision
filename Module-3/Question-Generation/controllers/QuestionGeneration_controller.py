from groq import Groq
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()  
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_questions_service(job_title, skills, experience_level, num_questions):
    
    # 1. Load prompt file
    with open("prompts/QuestionGeneration_template.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()
    
    # 2. Fill prompt with dynamic data
    final_prompt = prompt_template.format(
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
        num_questions=num_questions
    )

    # 3. Call Groq LLaMA model
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": final_prompt
            }
        ],
        temperature=0.2
    )

    # 4. Return model output
    return completion.choices[0].message.content
