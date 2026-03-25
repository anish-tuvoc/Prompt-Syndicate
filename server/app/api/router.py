from fastapi import APIRouter
from app.api.routes import auth, events, seats, lock, booking, admin, realtime

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(seats.router, prefix="/seats", tags=["seats"])
api_router.include_router(lock.router, prefix="/lock-seats", tags=["lock"])
api_router.include_router(booking.router, prefix="/bookings", tags=["booking"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(realtime.router, tags=["realtime"])
