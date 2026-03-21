from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.models.seat import Seat, SeatStatus
from app.models.seat_lock import SeatLock
from app.models.event import Event
from app.schemas.seat import SeatCreate, SeatResponse
from app.core.dependencies import get_current_admin

router = APIRouter()

@router.get("/event/{event_id}", response_model=List[SeatResponse])
def get_event_seats(event_id: UUID, db: Session = Depends(get_db)):
    # Clean up expired locks so they show as AVAILABLE
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    expired_locks = (
        db.query(SeatLock)
        .join(Seat, Seat.id == SeatLock.seat_id)
        .filter(Seat.event_id == event_id, SeatLock.expires_at < now_naive)
        .all()
    )
    for lock in expired_locks:
        seat = db.query(Seat).filter(Seat.id == lock.seat_id).first()
        if seat and seat.status == SeatStatus.LOCKED:
            seat.status = SeatStatus.AVAILABLE
        db.delete(lock)
    if expired_locks:
        db.commit()

    seats = db.query(Seat).filter(Seat.event_id == event_id).all()
    return seats

@router.post("/", response_model=SeatResponse)
def create_seat(seat_in: SeatCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == seat_in.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    seat = Seat(**seat_in.model_dump())
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return seat
