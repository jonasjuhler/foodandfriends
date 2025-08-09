import uuid
from datetime import datetime, timedelta

import httpx
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User
from jose import JWTError, jwt


class AuthService:
    def __init__(self):
        self.google_client_id = settings.GOOGLE_CLIENT_ID
        self.google_client_secret = settings.GOOGLE_CLIENT_SECRET
        self.jwt_secret = settings.JWT_SECRET_KEY
        self.jwt_algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    async def verify_google_token(self, token: str) -> dict:
        """Verify Google ID token and return user info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
                if response.status_code == 200:
                    return response.json()
                else:
                    raise ValueError("Invalid Google token")
        except Exception as e:
            raise ValueError(f"Error verifying Google token: {str(e)}")

    def create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> dict:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except JWTError:
            raise ValueError("Invalid token")

    async def get_or_create_user(self, google_user_info: dict) -> User:
        """Get existing user or create new user from Google info"""
        db = get_database()
        if not db:
            raise ValueError("Database connection not available")

        users_collection = db[settings.DATABASE_NAME].users

        # Check if user exists
        existing_user = users_collection.find_one({"google_id": google_user_info["sub"]})

        if existing_user:
            # Update last login
            users_collection.update_one(
                {"google_id": google_user_info["sub"]}, {"$set": {"updated_at": datetime.utcnow()}}
            )
            return User(**existing_user)
        else:
            # Create new user
            new_user = User(
                user_id=str(uuid.uuid4()),
                google_id=google_user_info["sub"],
                email=google_user_info["email"],
                name=google_user_info.get("name", "Unknown"),
                email_opt_in=True,
                is_admin=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            users_collection.insert_one(new_user.model_dump())
            return new_user

    def get_database(self):
        """Get database connection"""
        return get_database()

    @property
    def settings(self):
        """Get settings"""
        return settings


auth_service = AuthService()
