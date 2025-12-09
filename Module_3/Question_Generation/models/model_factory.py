from groq import Groq
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

class ModelFactory:
    Models = {
        "llama_large": "llama-3.3-70b-versatile",
        "llama_small": "llama-3.1-8b",
        "mixtral": "mixtral-8x7b-instruct",
        "gemma": "gemma-7b",
        "gpt_oss20": "openai/gpt-oss-20b",
        "gpt_oss120": "openai/gpt-oss-120b",
    }   

    active_model_key = "gpt_oss120"

    @staticmethod
    def get_model(model_key: str) -> str:
        return ModelFactory.Models.get(model_key)    