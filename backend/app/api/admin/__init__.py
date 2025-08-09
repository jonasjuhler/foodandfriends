from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException

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
