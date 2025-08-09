from typing import List, Optional

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/bookings")
def list_all_bookings(_: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    bookings = list(db[settings.DATABASE_NAME].bookings.find({}, {"_id": 0}))
    return {"count": len(bookings), "items": bookings}


@router.get("/bookings/by-day")
def list_bookings_grouped_by_day(_: User = Depends(require_admin)):
    """Return bookings grouped per day with user names and emails included."""
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Load days and index by day_id
    days = list(db[settings.DATABASE_NAME].days.find({}, {"_id": 0}))
    # Index maps could be used for additional fields if needed

    # Load users and index by user_id
    users = list(db[settings.DATABASE_NAME].users.find({}, {"_id": 0}))
    user_by_id = {u["user_id"]: u for u in users}

    # Prepare day containers
    result = []
    for d in sorted(days, key=lambda dd: dd.get("date")):
        result.append(
            {
                "day_id": d["day_id"],
                "date": d.get("date"),
                "theme": d.get("theme"),
                "capacity": d.get("capacity", 6),
                "bookings": [],
            }
        )

    result_by_day_id = {entry["day_id"]: entry for entry in result}

    # Load bookings and attach
    bookings = list(db[settings.DATABASE_NAME].bookings.find({}, {"_id": 0}))
    for b in bookings:
        day_id = b.get("day_id")
        day_entry = result_by_day_id.get(day_id)
        if not day_entry:
            # Skip bookings for unknown days
            continue
        user = user_by_id.get(b.get("user_id"), {})
        day_entry["bookings"].append(
            {
                "booking_id": b.get("booking_id"),
                "user_id": b.get("user_id"),
                "user_name": user.get("name"),
                "user_email": user.get("email"),
                "booking_date": b.get("booking_date"),
                "status": b.get("status"),
            }
        )

    # Sort bookings by user name for readability
    for entry in result:
        entry["bookings"].sort(key=lambda bb: (bb.get("user_name") or "").lower())

    return {"days": result}


# ---- Content Management ----
class UpdateDayRequest(BaseModel):
    theme: Optional[str] = None
    menu: Optional[str] = None
    capacity: Optional[int] = None
    date: Optional[str] = None  # ISO string


@router.get("/days")
def admin_list_days(_: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    days = list(db[settings.DATABASE_NAME].days.find({}, {"_id": 0}))
    days.sort(key=lambda d: d.get("date"))
    return {"items": days}


@router.put("/days/{day_id}")
def admin_update_day(day_id: str, req: UpdateDayRequest, _: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    updates = {}
    if req.theme is not None:
        updates["theme"] = req.theme
    if req.menu is not None:
        updates["menu"] = req.menu
    if req.capacity is not None:
        updates["capacity"] = req.capacity
    if req.date is not None:
        from datetime import datetime

        try:
            updates["date"] = datetime.fromisoformat(req.date.replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format")

    if not updates:
        return {"updated": False}

    result = db[settings.DATABASE_NAME].days.update_one({"day_id": day_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Day not found")
    day = db[settings.DATABASE_NAME].days.find_one({"day_id": day_id}, {"_id": 0})
    return {"updated": True, "day": day}


class CreateDayRequest(BaseModel):
    date: str  # ISO string
    theme: str
    menu: str
    capacity: int = 6


@router.post("/days")
def admin_create_day(req: CreateDayRequest, _: User = Depends(require_admin)):
    import uuid
    from datetime import datetime

    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    festival = db[settings.DATABASE_NAME].festivals.find_one({})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")

    try:
        day_date = datetime.fromisoformat(req.date.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format")

    new_day = {
        "day_id": str(uuid.uuid4()),
        "festival_id": festival.get("festival_id"),
        "date": day_date,
        "theme": req.theme,
        "menu": req.menu,
        "tickets_sold": 0,
        "capacity": req.capacity,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    db[settings.DATABASE_NAME].days.insert_one(new_day)
    return {"created": True, "day": {k: v for k, v in new_day.items() if k != "_id"}}


@router.delete("/days/{day_id}")
def admin_delete_day(day_id: str, _: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    existing_bookings = db[settings.DATABASE_NAME].bookings.count_documents({"day_id": day_id})
    if existing_bookings > 0:
        raise HTTPException(status_code=400, detail="Cannot delete day with existing bookings")

    result = db[settings.DATABASE_NAME].days.delete_one({"day_id": day_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Day not found")
    return {"deleted": True, "day_id": day_id}


class UpdateFestivalRequest(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    price: Optional[float] = None
    capacity_per_day: Optional[int] = None


@router.get("/festival")
def admin_get_festival(_: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    fest = db[settings.DATABASE_NAME].festivals.find_one({}, {"_id": 0})
    if not fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    return fest


@router.put("/festival")
def admin_update_festival(req: UpdateFestivalRequest, _: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    updates = {}
    if req.name is not None:
        updates["name"] = req.name
    if req.location is not None:
        updates["location"] = req.location
    if req.price is not None:
        updates["price"] = req.price
    if req.capacity_per_day is not None:
        updates["capacity_per_day"] = req.capacity_per_day
    from datetime import datetime

    if req.start_date is not None:
        updates["start_date"] = datetime.fromisoformat(req.start_date.replace("Z", "+00:00"))
    if req.end_date is not None:
        updates["end_date"] = datetime.fromisoformat(req.end_date.replace("Z", "+00:00"))

    if not updates:
        return {"updated": False}
    db[settings.DATABASE_NAME].festivals.update_one({}, {"$set": updates})
    fest = db[settings.DATABASE_NAME].festivals.find_one({}, {"_id": 0})
    return {"updated": True, "festival": fest}


# ---- Booking Management ----
@router.get("/bookings/search")
def admin_search_bookings(
    day_id: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    _: User = Depends(require_admin),
):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    query: dict = {}
    if day_id:
        query["day_id"] = day_id
    bookings = list(db[settings.DATABASE_NAME].bookings.find(query, {"_id": 0}))
    if email or name:
        # Join users
        users = list(db[settings.DATABASE_NAME].users.find({}, {"_id": 0}))
        user_by_id = {u["user_id"]: u for u in users}

        def match(b):
            u = user_by_id.get(b.get("user_id"), {})
            if email and email.lower() not in (u.get("email", "").lower()):
                return False
            if name and name.lower() not in (u.get("name", "").lower()):
                return False
            return True

        bookings = [b for b in bookings if match(b)]
    return {"count": len(bookings), "items": bookings}


class AdminCreateBookingRequest(BaseModel):
    day_id: str
    email: str


@router.post("/bookings")
def admin_create_booking(req: AdminCreateBookingRequest, _: User = Depends(require_admin)):
    from datetime import datetime

    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Validate day
    day = db[settings.DATABASE_NAME].days.find_one({"day_id": req.day_id})
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    # Find user by email
    user = db[settings.DATABASE_NAME].users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Enforce one booking per user
    existing = db[settings.DATABASE_NAME].bookings.find_one({"user_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="User already has a booking")

    # Capacity check
    count_for_day = db[settings.DATABASE_NAME].bookings.count_documents({"day_id": req.day_id})
    if count_for_day >= day.get("capacity", 6):
        raise HTTPException(status_code=400, detail="Day is fully booked")

    # Create booking
    import uuid

    new_booking = {
        "booking_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "day_id": req.day_id,
        "festival_id": day["festival_id"],
        "booking_date": datetime.utcnow(),
        "status": "confirmed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    db[settings.DATABASE_NAME].bookings.insert_one(new_booking)
    return {"booking": {k: v for k, v in new_booking.items() if k != "_id"}}


@router.get("/bookings/export", response_class=PlainTextResponse)
def admin_export_bookings(day_id: Optional[str] = None, _: User = Depends(require_admin)):
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    query: dict = {}
    if day_id:
        query["day_id"] = day_id
    bookings = list(db[settings.DATABASE_NAME].bookings.find(query, {"_id": 0}))
    users = list(db[settings.DATABASE_NAME].users.find({}, {"_id": 0}))
    user_by_id = {u["user_id"]: u for u in users}
    # CSV header
    lines: List[str] = ["booking_id,day_id,user_name,user_email,booking_date,status"]
    from datetime import datetime

    for b in bookings:
        u = user_by_id.get(b.get("user_id"), {})
        date_str = b.get("booking_date")
        if isinstance(date_str, datetime):
            date_str = date_str.isoformat()
        line = ",".join(
            [
                str(b.get("booking_id", "")),
                str(b.get("day_id", "")),
                '"' + (u.get("name", "").replace('"', '""')) + '"',
                u.get("email", ""),
                str(date_str or ""),
                b.get("status", ""),
            ]
        )
        lines.append(line)
    return "\n".join(lines)
