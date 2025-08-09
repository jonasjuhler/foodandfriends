from datetime import datetime
from typing import Any, Dict, Optional

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email_opt_in: Optional[bool] = None


@router.get("/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/profile", response_model=User)
async def update_profile(request: UpdateProfileRequest, current_user: User = Depends(get_current_user)) -> User:
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    updates: Dict[str, Any] = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.email_opt_in is not None:
        updates["email_opt_in"] = request.email_opt_in

    if not updates:
        return current_user

    updates["updated_at"] = datetime.utcnow()

    result = db[settings.DATABASE_NAME].users.update_one({"user_id": current_user.user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Return updated user without relying on dynamic **kwargs typing
    updated_user_dict: Dict[str, Any] = current_user.model_dump()
    updated_user_dict.update({k: v for k, v in updates.items() if k in updated_user_dict or k == "email_opt_in"})
    return User(**updated_user_dict)
