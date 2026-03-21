from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: datetime

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
