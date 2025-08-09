from datetime import datetime

from pydantic import BaseModel, Field


class Booking(BaseModel):
    booking_id: str  # Our own ID field for business logic
    user_id: str
    day_id: str
    festival_id: str
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "confirmed"  # "confirmed", "cancelled"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
