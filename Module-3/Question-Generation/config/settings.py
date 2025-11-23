import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY is None:
    raise ValueError("GROQ_API_KEY is not set in the environment variables.")

DEFAULT_TEMPERATURE = 0.5 
GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 1500
QUESTION_COUNT = 5

# Fix: Point to the correct prompts directory
PROMPT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
QG_TEMPLATE_FILE = "qg_template.txt"

GLOBAL_EXPERT_PROFILE = {
    "EXPERT_ROLE": "Senior Data Analyst",
    "EXPERIENCE_LEVEL": "10+ years",
    "REQUIRED_SKILLS": "Data Analysis, Machine Learning, Statistical Modeling",
    "JOB_DESCRIPTION_FOCUS": "Technical comprehension and analytical thinking"
}