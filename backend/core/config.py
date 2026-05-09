from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    environment: str = "development"
    max_tokens: int = 4096

    class Config:
        env_file = ".env"

settings = Settings()