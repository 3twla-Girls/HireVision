from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    APP_NAME: str
    APP_VERSION: str
    OPENAI_API_KEY: str

    FILE_ALLOWED_TYPES: list
    FILE_MAX_SIZE: int
    FILE_DEFAULT_CHUNK_SIZE: int

    MONGODB_URL: str
    MONGODB_DATABASE: str
    
    EMBED_MODEL: str
    CE_MODEL: str

    CACHE_DIR: str
    DATA_DIR: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

def get_settings():
    return Settings()
