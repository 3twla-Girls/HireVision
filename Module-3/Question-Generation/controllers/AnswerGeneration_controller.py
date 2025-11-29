import json
from groq import Groq
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import models.model_factory as model_factory

load_dotenv()  
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_answers_service(questions, job_title, skills, experience_level, model_key):
    """
    Generate reference answers for the provided questions.
    
    Args:
        questions: List of question objects with 'id' and 'question' fields
        job_title: Job title for context
        skills: List of relevant skills
        experience_level: Junior/Mid/Senior
        model_key: Model to use for generation
    
    Returns:
        Dictionary with questions and their reference answers
    """
    
    # Load answer generation prompt
    with open("prompts/AnswerGeneration_template.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()
    
    # Format questions for the prompt
    questions_text = "\n".join([
        f"{q['id']}. {q['question']}" 
        for q in questions
    ])
    
    final_prompt = prompt_template.format(
        job_title=job_title,
        skills=", ".join(skills),
        experience_level=experience_level,
        questions=questions_text
    )

    # Call Groq model
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
    except Exception as e:
        result = {
            "answers": [], 
            "raw_output": raw_output,
            "error": str(e)
        }

    return result