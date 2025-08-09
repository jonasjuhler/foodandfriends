from typing import Optional

from app.core.config import settings
from pymongo import MongoClient


class Database:
    client: Optional[MongoClient] = None


db = Database()


def get_database() -> Optional[MongoClient]:
    return db.client


def connect_to_mongo():
    db.client = MongoClient(settings.MONGODB_CONNECTION_STRING)
    print("Connected to MongoDB.")


def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB.")
