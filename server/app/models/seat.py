import uuid
import enum
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class SeatStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LOCKED = "LOCKED"
    BOOKED = "BOOKED"

class Seat(Base):
    __tablename__ = "seats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    seat_number = Column(String, nullable=False)
    status = Column(SQLEnum(SeatStatus), default=SeatStatus.AVAILABLE, nullable=False)

    event = relationship("Event", back_populates="seats")
    active_lock = relationship("SeatLock", back_populates="seat", uselist=False)
    booking_seats = relationship("BookingSeat", back_populates="seat", cascade="all, delete-orphan")
