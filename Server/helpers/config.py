from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List
from pathlib import Path

# path to Server folder
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    OPENAI_API_KEY: str

    FILE_ALLOWED_TYPES: List[str]
    FILE_MAX_SIZE: int
    FILE_DEFAULT_CHUNK_SIZE: int

    MONGODB_URL: str
    MONGODB_DATABASE: str
    EMBED_MODEL: str
    CE_MODEL: str
    CLOUDINARY_URL: str
    GROQ_API_KEY: str
    MODULE3_URL: str
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",   # ← this points to Server/.env
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()