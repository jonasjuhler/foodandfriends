import uuid
from datetime import datetime
from typing import Optional

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_database
from app.models.booking import Booking
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/bookings", tags=["bookings"])


class CreateBookingRequest(BaseModel):
    day_id: str


class BookingResponse(BaseModel):
    booking_id: str
    user_id: str
    day_id: str
    festival_id: str
    booking_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime


@router.post("/", response_model=BookingResponse)
async def create_booking(request: CreateBookingRequest, current_user: User = Depends(get_current_user)):
    """Create a new booking for the current user"""
    print(f"Creating booking for user {current_user.user_id} for day {request.day_id}")

    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Check if user already has a booking
    existing_booking = db[settings.DATABASE_NAME].bookings.find_one({"user_id": current_user.user_id})
    if existing_booking:
        raise HTTPException(status_code=400, detail="You already have a booking. You can only book one ticket.")

        # Check if the day exists in the database
    day = db[settings.DATABASE_NAME].days.find_one({"day_id": request.day_id})
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    # Check ticket availability
    existing_bookings_for_day = db[settings.DATABASE_NAME].bookings.count_documents({"day_id": request.day_id})
    if existing_bookings_for_day >= 6:  # Capacity per day
        raise HTTPException(status_code=400, detail="This day is fully booked")

    # Create the booking
    new_booking = Booking(
        booking_id=str(uuid.uuid4()),
        user_id=current_user.user_id,
        day_id=request.day_id,
        festival_id=day["festival_id"],
        booking_date=datetime.utcnow(),
        status="confirmed",
    )

    print(f"New booking data: {new_booking.model_dump()}")

    db[settings.DATABASE_NAME].bookings.insert_one(new_booking.model_dump())

    print(f"Booking created with ID: {new_booking.booking_id}")

    return BookingResponse(**new_booking.model_dump())


@router.get("/my-booking", response_model=Optional[BookingResponse])
async def get_my_booking(current_user: User = Depends(get_current_user)):
    """Get the current user's booking"""
    print(f"get_my_booking called for user: {current_user.user_id}")

    db = get_database()
    if not db:
        print("Database connection error")
        raise HTTPException(status_code=500, detail="Database connection error")

    booking_data = db[settings.DATABASE_NAME].bookings.find_one({"user_id": current_user.user_id})
    print(f"Found booking data: {booking_data}")

    if not booking_data:
        print("No booking found, returning None")
        return None

    print("Returning booking response")
    return BookingResponse(**booking_data)


@router.put("/my-booking", response_model=BookingResponse)
async def update_my_booking(request: CreateBookingRequest, current_user: User = Depends(get_current_user)):
    """Update the current user's booking to a different day"""
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Check if user has an existing booking
    existing_booking = db[settings.DATABASE_NAME].bookings.find_one({"user_id": current_user.user_id})
    if not existing_booking:
        raise HTTPException(status_code=404, detail="No booking found to update")

        # Check if the new day exists in the database
    try:
        day = db[settings.DATABASE_NAME].days.find_one({"day_id": request.day_id})
        if not day:
            raise HTTPException(status_code=404, detail="Day not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid day ID format")

    # Check ticket availability (excluding current user's booking)
    existing_bookings_for_day = db[settings.DATABASE_NAME].bookings.count_documents(
        {"day_id": request.day_id, "user_id": {"$ne": current_user.user_id}}
    )
    if existing_bookings_for_day >= 6:  # Capacity per day
        raise HTTPException(status_code=400, detail="This day is fully booked")

    # Update the booking
    updated_booking = Booking(
        booking_id=existing_booking["booking_id"],
        user_id=current_user.user_id,
        day_id=request.day_id,
        festival_id=day["festival_id"],
        booking_date=existing_booking["booking_date"],
        status="confirmed",
    )

    db[settings.DATABASE_NAME].bookings.update_one(
        {"_id": existing_booking["_id"]},
        {"$set": {"day_id": request.day_id, "festival_id": day["festival_id"], "updated_at": datetime.utcnow()}},
    )

    return BookingResponse(**updated_booking.model_dump())


@router.delete("/my-booking")
async def cancel_my_booking(current_user: User = Depends(get_current_user)):
    """Cancel the current user's booking"""
    db = get_database()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")

    result = db[settings.DATABASE_NAME].bookings.delete_one({"user_id": current_user.user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No booking found to cancel")

    return {"message": "Booking cancelled successfully"}
