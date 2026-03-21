from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.models.seat import SeatStatus


class MetricPoint(BaseModel):
    label: str
    value: float


class DashboardMetrics(BaseModel):
    total_events: int
    total_bookings: int
    total_revenue: float
    bookings_per_day: list[MetricPoint]
    revenue_trend: list[MetricPoint]


class ActivityItem(BaseModel):
    booking_id: UUID
    user_id: UUID
    event_id: UUID
    status: str
    created_at: datetime


class AdminSeatView(BaseModel):
    id: UUID
    seat_number: str
    status: SeatStatus
    is_locked: bool
    locked_by: UUID | None = None
    lock_expires_at: datetime | None = None


class ActiveLockView(BaseModel):
    seat_id: UUID
    user_id: UUID
    expires_at: datetime
    seconds_remaining: int


class BookingSeatItem(BaseModel):
    seat_id: UUID
    seat_number: str


class AdminBookingView(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    status: str
    created_at: datetime
    payment_status: str
    seats: list[BookingSeatItem]


class UserView(BaseModel):
    id: UUID
    email: str
    created_at: datetime
