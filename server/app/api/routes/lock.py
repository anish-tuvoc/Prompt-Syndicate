from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.db.session import get_db
from app.models.seat import Seat, SeatStatus
from app.models.seat_lock import SeatLock
from app.schemas.lock import LockRequest, LockResponse
from app.core.dependencies import get_current_user

router = APIRouter()
LOCK_DURATION_MINUTES = 1

@router.post("/", response_model=LockResponse)
def lock_seat(request: LockRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    # 1. Fetch seat with row-level lock (SELECT FOR UPDATE)
    seat = db.query(Seat).with_for_update().filter(Seat.id == request.seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    if seat.status == SeatStatus.BOOKED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat is already booked.")

    # 2. Check if locked by someone else and lock is still valid
    existing_lock = db.query(SeatLock).with_for_update().filter(SeatLock.seat_id == seat.id).first()
    
    if existing_lock:
        # Use timezone.utc since expires_at is usually naive out of Postgres unless specifically formatted. We treat it as UTC.
        # Actually in SQLAlchemy DateTime can be timezone aware, but if naive assume UTC.
        # It's safer to compare naive UTC with naive UTC or aware with aware.
        # Let's ensure 'now' is compatible with existing_lock.expires_at by removing tzinfo if necessary
        expires_at_naive = existing_lock.expires_at.replace(tzinfo=None)
        now_naive = now.replace(tzinfo=None)
        
        if expires_at_naive > now_naive:
            if existing_lock.user_id == current_user.id:
                # Extend lock if it's the same user
                existing_lock.expires_at = now + timedelta(minutes=LOCK_DURATION_MINUTES)
                db.commit()
                db.refresh(existing_lock)
                return existing_lock
            else:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat is currently locked by another user.")
        else:
            # Existing lock is expired, we can overwrite it
            db.delete(existing_lock)

    # 3. Create new lock
    new_lock = SeatLock(
        seat_id=seat.id,
        user_id=current_user.id,
        locked_at=now,
        expires_at=now + timedelta(minutes=LOCK_DURATION_MINUTES)
    )
    db.add(new_lock)
    
    # Update seat status
    seat.status = SeatStatus.LOCKED
    
    db.commit()
    db.refresh(new_lock)
    return new_lock


@router.delete("/{seat_id}")
def unlock_seat(seat_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Release a lock held by the current user (e.g. when they deselect a seat)."""
    lock = db.query(SeatLock).filter(SeatLock.seat_id == seat_id).first()
    if not lock:
        return {"ok": True}  # no lock to release

    if lock.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot unlock a seat locked by another user.")

    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if seat and seat.status == SeatStatus.LOCKED:
        seat.status = SeatStatus.AVAILABLE

    db.delete(lock)
    db.commit()
    return {"ok": True}
