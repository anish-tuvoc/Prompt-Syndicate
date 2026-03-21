from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    db = SessionLocal()
    init_db(db)
    db.close()
    yield

app = FastAPI(title="Ticket Booking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for hackathon simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running!"}
