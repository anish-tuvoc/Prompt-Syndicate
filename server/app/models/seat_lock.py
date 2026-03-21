import uuid
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class SeatLock(Base):
    __tablename__ = "seat_locks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seat_id = Column(UUID(as_uuid=True), ForeignKey("seats.id"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    locked_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    seat = relationship("Seat", back_populates="active_lock")
    user = relationship("User")
