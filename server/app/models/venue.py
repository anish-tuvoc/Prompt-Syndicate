import uuid
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from app.db.base import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    location = Column(String, nullable=False)
    total_rows = Column(Integer, nullable=False)
    total_columns = Column(Integer, nullable=False)
    sections = Column(JSON, default=list, nullable=False)
