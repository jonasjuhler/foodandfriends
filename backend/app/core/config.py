from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    MONGODB_CONNECTION_STRING: str = "mongodb://localhost:27017"
    MONGODB_URI: str = "mongodb://localhost:27017"  # Alternative name
    DATABASE_NAME: str = "foodandfriends"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # AWS SES
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # App
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()

# Debug: Print the MongoDB connection string (without password for security)
print(f"MongoDB Connection String: {settings.MONGODB_CONNECTION_STRING[:20]}...")
print(f"Database Name: {settings.DATABASE_NAME}")
print(f"Google Client ID: {settings.GOOGLE_CLIENT_ID[:20] if settings.GOOGLE_CLIENT_ID else 'NOT SET'}...")
