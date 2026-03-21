from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class LockRequest(BaseModel):
    seat_id: UUID

class LockResponse(BaseModel):
    id: UUID
    seat_id: UUID
    user_id: UUID
    locked_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
