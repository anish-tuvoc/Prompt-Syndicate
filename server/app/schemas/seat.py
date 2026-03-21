from pydantic import BaseModel
from uuid import UUID
from app.models.seat import SeatStatus

class SeatBase(BaseModel):
    seat_number: str

class SeatCreate(SeatBase):
    event_id: UUID

class SeatResponse(SeatBase):
    id: UUID
    event_id: UUID
    status: SeatStatus
    
    class Config:
        from_attributes = True
