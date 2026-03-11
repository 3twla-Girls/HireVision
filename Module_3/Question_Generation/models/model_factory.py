import os
from dotenv import load_dotenv

load_dotenv()

class ModelFactory:
    Models = {
        "llama_large": "llama-3.3-70b-versatile",
        "llama_small": "llama-3.1-8b-instant",
        "gpt_oss20": "openai/gpt-oss-20b",
        "gpt_oss120": "openai/gpt-oss-120b",
    }   

    active_model_key = os.getenv("ACTIVE_MODEL_KEY", "gpt_oss120")

    @staticmethod
    def get_model(model_key: str) -> str:
        return ModelFactory.Models.get(model_key)    