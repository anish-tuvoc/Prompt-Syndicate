from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.booking import BookingStatus

class BookingRequest(BaseModel):
    event_id: UUID
    seat_ids: list[UUID]

class BookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    status: BookingStatus
    created_at: datetime
    
    class Config:
        from_attributes = True
