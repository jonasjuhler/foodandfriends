from datetime import datetime

from pydantic import BaseModel, Field


class Day(BaseModel):
    day_id: str  # Our own ID field for business logic
    festival_id: str
    date: datetime
    theme: str
    menu: str
    tickets_sold: int = 0
    capacity: int = 6
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
