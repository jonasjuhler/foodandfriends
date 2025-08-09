#!/usr/bin/env python3
"""
Script to populate the MongoDB database with festival data
"""
from datetime import datetime

from app.core.config import settings
from app.core.database import connect_to_mongo, get_database


def populate_database():
    """Populate the database with festival and day data"""

    # Connect to MongoDB
    connect_to_mongo()
    db = get_database()

    if not db:
        print("❌ Failed to connect to database")
        return

    database = db[settings.DATABASE_NAME]

    print("🗄️  Connected to MongoDB")

    # Create festival document
    festival_data = {
        "name": "Food & Friends Festival",
        "start_date": datetime(2024, 11, 3),
        "end_date": datetime(2024, 11, 7),
        "location": "Guldbergsgade 51A, 4. tv., 2200 København N",
        "price": 50.0,
        "capacity_per_day": 6,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # Insert festival (MongoDB will create the _id automatically)
    result = database.festivals.insert_one(festival_data)
    festival_id = str(result.inserted_id)
    print(f"✅ Festival document created with ID: {festival_id}")

    # Create day documents
    days_data = [
        {
            "day_id": "1",  # Our own ID for business logic
            "festival_id": festival_id,
            "date": datetime(2024, 11, 3),
            "theme": "Autumn Harvest",
            "menu": "Seasonal vegetables, roasted meats, and warm spices",
            "capacity": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "day_id": "2",  # Our own ID for business logic
            "festival_id": festival_id,
            "date": datetime(2024, 11, 4),
            "theme": "Mediterranean Night",
            "menu": "Fresh seafood, olive oil, and Mediterranean herbs",
            "capacity": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "day_id": "3",  # Our own ID for business logic
            "festival_id": festival_id,
            "date": datetime(2024, 11, 5),
            "theme": "Asian Fusion",
            "menu": "Sushi, stir-fries, and exotic spices",
            "capacity": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "day_id": "4",  # Our own ID for business logic
            "festival_id": festival_id,
            "date": datetime(2024, 11, 6),
            "theme": "Comfort Classics",
            "menu": "Homestyle cooking, comfort foods, and hearty portions",
            "capacity": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "day_id": "5",  # Our own ID for business logic
            "festival_id": festival_id,
            "date": datetime(2024, 11, 7),
            "theme": "Sweet Endings",
            "menu": "Desserts, pastries, and sweet treats",
            "capacity": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]

    # Insert each day (MongoDB will create the _id automatically)
    day_ids = []
    for day_data in days_data:
        result = database.days.insert_one(day_data)
        day_id = str(result.inserted_id)
        day_ids.append(day_id)
        print(f"✅ Day {day_id} ({day_data['theme']}) created")

    print("\n📋 Day IDs for reference:")
    for i, day_id in enumerate(day_ids, 1):
        print(f"   Day {i}: {day_id}")

    print("\n🎉 Database population completed!")
    print(f"📊 Created/Updated: 1 festival, {len(days_data)} days")


if __name__ == "__main__":
    populate_database()
