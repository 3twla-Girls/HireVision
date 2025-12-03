import json
from groq import Groq
from dotenv import load_dotenv
import os
import models.model_factory as model_factory
from utils.prompt_utils import SystemPromptCache
from utils.schemas import QUESTION_SCHEMA

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
    Generate technical interview questions using Groq LLaMA.
    Uses cached system prompt and guided JSON schema decoding.
    
    Returns:
        dict: Contains 'questions' list or 'error' message
    """
    
    system_prompt = SystemPromptCache.load("prompts/QuestionGeneration_system.txt")
    
    user_prompt = (
        f"Job Role/Title: {job_title}\n"
        f"Required Skills: {', '.join(skills)}\n"
        f"Experience Level: {experience_level}\n"
        f"Number of Questions Needed: {num_questions}"
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
                    "name": "InterviewQuestions",
                    "schema": QUESTION_SCHEMA  
                }
            },
            temperature=0.1
        )
        
        raw_output = completion.choices[0].message.content
        
        try:
            result = json.loads(raw_output)
            if "questions" not in result:
                return {"questions": [], "error": "Invalid response structure"}
            return result
            
        except json.JSONDecodeError as e:
            return {
                "questions": [], 
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output
            }
            
    except Exception as e:
        return {"questions": [], "error": f"API call failed: {str(e)}"}