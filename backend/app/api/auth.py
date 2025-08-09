from app.models.user import User
from app.services.auth import auth_service
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
security = HTTPBearer()


class GoogleLoginRequest(BaseModel):
    id_token: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


@router.post("/google/login", response_model=LoginResponse)
async def google_login(request: GoogleLoginRequest):
    """Login with Google OAuth"""
    try:
        print(f"Received login request with token length: {len(request.id_token)}")

        # Verify Google token
        google_user_info = await auth_service.verify_google_token(request.id_token)
        print(f"Google user info: {google_user_info}")

        # Get or create user
        user = await auth_service.get_or_create_user(google_user_info)

        # Create access token
        access_token = auth_service.create_access_token(data={"sub": user.google_id, "email": user.email})

        return LoginResponse(access_token=access_token, user=user)
    except ValueError as e:
        print(f"ValueError in login: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Exception in login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    try:
        payload = auth_service.verify_token(credentials.credentials)
        google_id = payload.get("sub")
        if google_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get user from database
    from app.core.config import settings
    from app.core.database import get_database

    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    users_collection = db[settings.DATABASE_NAME].users
    user_data = users_collection.find_one({"google_id": google_id})

    if user_data is None:
        raise HTTPException(status_code=401, detail="User not found")

    return User(**user_data)


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user
