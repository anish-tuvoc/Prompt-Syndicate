import uuid
from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    image = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    description = Column(Text)
    location = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    date = Column(String, nullable=False)
    time = Column(String, nullable=True)
    category = Column(String, nullable=True)
    featured = Column(Boolean, default=False)
    price = Column(Float, default=0.0)
    duration = Column(String, nullable=True)
    language = Column(String, nullable=True)
    tags = Column(JSON, default=list)
    total_seats = Column(Integer, default=0)
    event_type = Column(String, nullable=True)
    price_categories = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    seats = relationship("Seat", back_populates="event")
    bookings = relationship("Booking", back_populates="event")
