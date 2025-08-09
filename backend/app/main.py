from contextlib import asynccontextmanager

from app.api.auth import router as auth_router
from app.api.bookings import router as bookings_router
from app.api.festival import router as festival_router
from app.api.users import router as users_router
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    try:
        yield
    finally:
        close_mongo_connection()


app = FastAPI(
    title="Food & Friends API",
    description="API for the Food & Friends festival booking system",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(festival_router)
app.include_router(auth_router)
app.include_router(bookings_router)
app.include_router(users_router)


@app.get("/")
async def root():
    return {"message": "Food & Friends API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
