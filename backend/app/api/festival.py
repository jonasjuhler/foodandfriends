from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/festival", tags=["festival"])


@router.get("/info")
async def get_festival_info():
    """Get festival information"""
    return {
        "name": "Food & Friends Festival",
        "start_date": "2024-11-03T00:00:00Z",
        "end_date": "2024-11-07T23:59:59Z",
        "location": "Guldbergsgade 51A, 4. tv., 2200 København N",
        "price": 50.0,
        "capacity_per_day": 6,
    }


@router.get("/days")
async def get_festival_days():
    """Get all festival days with menus"""
    from app.core.config import settings
    from app.core.database import get_database

    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        # Get all days from database
        days_cursor = db[settings.DATABASE_NAME].days.find()
        days = []

        for day in days_cursor:
            # Count bookings for this day
            bookings_count = db[settings.DATABASE_NAME].bookings.count_documents({"day_id": day["day_id"]})

            days.append(
                {
                    "id": day["day_id"],  # Use our own day_id
                    "date": day["date"].isoformat(),
                    "theme": day["theme"],
                    "menu": day["menu"],
                    "tickets_sold": bookings_count,
                    "capacity": day["capacity"],
                    "available": day["capacity"] - bookings_count,
                }
            )

        # Sort by date
        days.sort(key=lambda x: x["date"])
        return days

    except Exception as e:
        print(f"Error fetching days from database: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")


@router.get("/availability")
async def get_ticket_availability():
    """Get ticket availability for all days"""
    availability = [
        {"day_id": "1", "date": "2024-11-03", "tickets_sold": 3, "available": 3, "total_capacity": 6},
        {"day_id": "2", "date": "2024-11-04", "tickets_sold": 2, "available": 4, "total_capacity": 6},
        {"day_id": "3", "date": "2024-11-05", "tickets_sold": 4, "available": 2, "total_capacity": 6},
        {"day_id": "4", "date": "2024-11-06", "tickets_sold": 1, "available": 5, "total_capacity": 6},
        {"day_id": "5", "date": "2024-11-07", "tickets_sold": 5, "available": 1, "total_capacity": 6},
    ]
    return availability
