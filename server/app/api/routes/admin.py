import asyncio
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_admin
from app.db.session import SessionLocal, get_db
from app.models.booking import Booking, BookingStatus
from app.models.booking_seat import BookingSeat
from app.models.event import Event
from app.models.seat import Seat, SeatStatus
from app.models.seat_lock import SeatLock
from app.models.user import User
from app.models.venue import Venue
from app.schemas.admin import (
    ActiveLockView,
    ActivityItem,
    AdminBookingView,
    AdminSeatView,
    BookingSeatItem,
    DashboardMetrics,
    MetricPoint,
    UserView,
)
from app.schemas.venue import VenueCreate, VenueResponse, VenueUpdate

router = APIRouter()


def _revenue_for_booking(booking: Booking, seats: list[BookingSeat]) -> float:
    # Approximate booking revenue as event base price * seats count.
    if booking.status == BookingStatus.CANCELLED:
        return 0.0
    seat_count = max(1, len(seats))
    return float((booking.event.price if booking.event else 0.0) * seat_count)


def _build_dashboard(db: Session) -> DashboardMetrics:
    total_events = db.query(Event).count()
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.event), joinedload(Booking.booking_seats))
        .all()
    )
    total_bookings = len(bookings)
    total_revenue = sum(
        _revenue_for_booking(booking, booking.booking_seats)
        for booking in bookings
        if booking.status == BookingStatus.CONFIRMED
    )

    today = datetime.now(timezone.utc).date()
    labels = [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]
    booking_counts = defaultdict(int)
    revenue_by_day = defaultdict(float)
    for booking in bookings:
        day = booking.created_at.date().isoformat()
        booking_counts[day] += 1
        revenue_by_day[day] += _revenue_for_booking(booking, booking.booking_seats)

    bookings_per_day = [MetricPoint(label=label, value=booking_counts[label]) for label in labels]
    revenue_trend = [MetricPoint(label=label, value=revenue_by_day[label]) for label in labels]
    return DashboardMetrics(
        total_events=total_events,
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        bookings_per_day=bookings_per_day,
        revenue_trend=revenue_trend,
    )


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard(db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    return _build_dashboard(db)


@router.get("/activity", response_model=list[ActivityItem])
def get_recent_activity(
    limit: int = 20, db: Session = Depends(get_db), _: object = Depends(get_current_admin)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(limit).all()
    return [
        ActivityItem(
            booking_id=booking.id,
            user_id=booking.user_id,
            event_id=booking.event_id,
            status=booking.status.value,
            created_at=booking.created_at,
        )
        for booking in bookings
    ]


@router.get("/venues", response_model=list[VenueResponse])
def list_venues(db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    return db.query(Venue).order_by(Venue.name.asc()).all()


@router.post("/venues", response_model=VenueResponse)
def create_venue(
    payload: VenueCreate, db: Session = Depends(get_db), _: object = Depends(get_current_admin)
):
    duplicate = db.query(Venue).filter(Venue.name == payload.name).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Venue with this name already exists")
    venue = Venue(**payload.model_dump())
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


@router.put("/venues/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: UUID,
    payload: VenueUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(venue, key, value)
    db.commit()
    db.refresh(venue)
    return venue


@router.delete("/venues/{venue_id}")
def delete_venue(venue_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    db.delete(venue)
    db.commit()
    return {"ok": True}


@router.get("/seats/event/{event_id}", response_model=list[AdminSeatView])
def admin_event_seat_map(
    event_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)
):
    seats = db.query(Seat).filter(Seat.event_id == event_id).order_by(Seat.seat_number.asc()).all()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    response: list[AdminSeatView] = []
    for seat in seats:
        lock = db.query(SeatLock).filter(SeatLock.seat_id == seat.id).first()
        is_locked = False
        locked_by = None
        lock_expires_at = None
        if lock and lock.expires_at.replace(tzinfo=None) > now:
            is_locked = True
            locked_by = lock.user_id
            lock_expires_at = lock.expires_at
        response.append(
            AdminSeatView(
                id=seat.id,
                seat_number=seat.seat_number,
                status=seat.status,
                is_locked=is_locked,
                locked_by=locked_by,
                lock_expires_at=lock_expires_at,
            )
        )
    return response


@router.post("/seats/{seat_id}/force-unlock")
def force_unlock_seat(seat_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    lock = db.query(SeatLock).filter(SeatLock.seat_id == seat_id).first()
    if lock:
        db.delete(lock)
    seat.status = SeatStatus.AVAILABLE
    db.commit()
    return {"ok": True}


@router.post("/seats/{seat_id}/block")
def block_seat(seat_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    lock = db.query(SeatLock).filter(SeatLock.seat_id == seat_id).first()
    if lock:
        db.delete(lock)
    seat.status = SeatStatus.BOOKED
    db.commit()
    return {"ok": True}


@router.get("/bookings", response_model=list[AdminBookingView])
def list_bookings(
    event_id: UUID | None = None,
    date: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    query = (
        db.query(Booking)
        .options(joinedload(Booking.booking_seats).joinedload(BookingSeat.seat))
        .order_by(Booking.created_at.desc())
    )
    if event_id:
        query = query.filter(Booking.event_id == event_id)
    if date:
        try:
            start = datetime.fromisoformat(date)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD") from exc
        end = start + timedelta(days=1)
        query = query.filter(Booking.created_at >= start, Booking.created_at < end)
    if status:
        try:
            status_value = BookingStatus(status)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid booking status") from exc
        query = query.filter(Booking.status == status_value)
    bookings = query.limit(500).all()
    return [
        AdminBookingView(
            id=booking.id,
            user_id=booking.user_id,
            event_id=booking.event_id,
            status=booking.status.value,
            created_at=booking.created_at,
            payment_status="SUCCESS" if booking.status == BookingStatus.CONFIRMED else "FAILED" if booking.status == BookingStatus.CANCELLED else "PENDING",
            seats=[
                BookingSeatItem(seat_id=item.seat_id, seat_number=item.seat.seat_number if item.seat else "N/A")
                for item in booking.booking_seats
            ],
        )
        for booking in bookings
    ]


@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.booking_seats).joinedload(BookingSeat.seat))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.CANCELLED
    for item in booking.booking_seats:
        if item.seat:
            item.seat.status = SeatStatus.AVAILABLE
    db.commit()
    return {"ok": True}


@router.get("/locks/active", response_model=list[ActiveLockView])
def active_locks(db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    locks = db.query(SeatLock).all()
    response: list[ActiveLockView] = []
    for lock in locks:
        expires_at = lock.expires_at.replace(tzinfo=None)
        remaining = int((expires_at - now).total_seconds())
        if remaining <= 0:
            continue
        response.append(
            ActiveLockView(
                seat_id=lock.seat_id,
                user_id=lock.user_id,
                expires_at=lock.expires_at,
                seconds_remaining=remaining,
            )
        )
    return response


@router.get("/users", response_model=list[UserView])
def list_users(db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).limit(500).all()


@router.get("/users/{user_id}/bookings", response_model=list[AdminBookingView])
def user_bookings(user_id: UUID, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.booking_seats).joinedload(BookingSeat.seat))
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [
        AdminBookingView(
            id=booking.id,
            user_id=booking.user_id,
            event_id=booking.event_id,
            status=booking.status.value,
            created_at=booking.created_at,
            payment_status="SUCCESS" if booking.status == BookingStatus.CONFIRMED else "FAILED" if booking.status == BookingStatus.CANCELLED else "PENDING",
            seats=[
                BookingSeatItem(seat_id=item.seat_id, seat_number=item.seat.seat_number if item.seat else "N/A")
                for item in booking.booking_seats
            ],
        )
        for booking in bookings
    ]


@router.websocket("/ws/activity")
async def activity_stream(ws: WebSocket):
    await ws.accept()
    db = SessionLocal()
    try:
        while True:
            metrics = _build_dashboard(db).model_dump()
            recent = get_recent_activity(limit=10, db=db, _=None)
            locks = active_locks(db=db, _=None)
            await ws.send_json(
                {
                    "dashboard": metrics,
                    "activity": [item.model_dump(mode="json") for item in recent],
                    "active_locks": [item.model_dump(mode="json") for item in locks],
                }
            )
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        return
    finally:
        db.close()
