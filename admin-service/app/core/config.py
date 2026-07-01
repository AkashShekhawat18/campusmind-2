import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "CampusMind Admin Service"
    DATABASE_URL: str = "sqlite:///../../backend/prisma/dev.db"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "supersecretkey")
    ALGORITHM: str = "HS256"

settings = Settings()
