from datetime import datetime

from pydantic import BaseModel, Field


class User(BaseModel):
    user_id: str  # Our own ID field for business logic
    google_id: str
    email: str
    name: str
    email_opt_in: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
