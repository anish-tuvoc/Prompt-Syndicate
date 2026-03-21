from pydantic import BaseModel, Field
from uuid import UUID


class VenueSection(BaseModel):
    id: str
    label: str
    seat_type: str = "REGULAR"
    price: float = 0.0


class VenueBase(BaseModel):
    name: str
    location: str
    total_rows: int = Field(ge=1)
    total_columns: int = Field(ge=1)
    sections: list[VenueSection] = []


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    total_rows: int | None = Field(default=None, ge=1)
    total_columns: int | None = Field(default=None, ge=1)
    sections: list[VenueSection] | None = None


class VenueResponse(VenueBase):
    id: UUID

    class Config:
        from_attributes = True
