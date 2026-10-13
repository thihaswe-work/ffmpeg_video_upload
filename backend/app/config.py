from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/my_video_app"
    SPACES_ENDPOINT: str = ""
    SPACES_REGION: str = ""
    SPACES_BUCKET: str = ""
    SPACES_KEY: str = ""
    SPACES_SECRET: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
