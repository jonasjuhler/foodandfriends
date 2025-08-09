from datetime import datetime

from pydantic import BaseModel, Field


class Festival(BaseModel):
    festival_id: str  # Our own ID field for business logic
    name: str
    start_date: datetime
    end_date: datetime
    location: str
    price: float
    capacity_per_day: int = 6
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
