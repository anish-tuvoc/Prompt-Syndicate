from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class PriceCategory(BaseModel):
    id: str
    label: str
    price: float
    color: str

class EventBase(BaseModel):
    title: str
    image: Optional[str] = None
    rating: Optional[float] = 0.0
    description: Optional[str] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    date: str
    time: Optional[str] = None
    category: Optional[str] = None
    featured: Optional[bool] = False
    price: Optional[float] = 0.0
    duration: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[list[str]] = []
    total_seats: Optional[int] = 0
    event_type: Optional[str] = None
    price_categories: Optional[list[PriceCategory]] = []

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
