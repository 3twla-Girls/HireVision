from utils.prompt_utils import SystemPromptCache
from utils.schemas import REFERENCE_ANSWER_SCHEMA
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
        f"Job Role: {job_title}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Experience Level: {experience_level}\n\n"
        f"Questions:\n{questions}"
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
                    "name": "ReferenceAnswers",
                    "schema": REFERENCE_ANSWER_SCHEMA  
                }
            },
            temperature=0.1
        )
        
        raw_output = completion.choices[0].message.content
        
        try:
            result = json.loads(raw_output)
            if "answers" not in result:
                return {
                    "answers": [], 
                    "error": "Invalid response structure - missing 'answers' key"
                }
            return result
            
        except json.JSONDecodeError as e:
            return {
                "answers": [], 
                "error": f"JSON parsing failed: {str(e)}",
                "raw_output": raw_output
            }
            
    except Exception as e:
        return {
            "answers": [], 
            "error": f"API call failed: {str(e)}"
        }
