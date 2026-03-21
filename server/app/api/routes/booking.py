from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from app.db.session import get_db
from app.models.seat import Seat, SeatStatus
from app.models.seat_lock import SeatLock
from app.models.booking import Booking, BookingStatus
from app.models.booking_seat import BookingSeat
from app.schemas.booking import BookingRequest, BookingResponse
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/confirm", response_model=BookingResponse)
def confirm_booking(request: BookingRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Verify all requested seats are locked by the current user
    for seat_id in request.seat_ids:
        seat = db.query(Seat).with_for_update().filter(Seat.id == seat_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail=f"Seat {seat_id} not found")
        
        lock = db.query(SeatLock).filter(SeatLock.seat_id == seat.id).first()
        
        if not lock:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Seat {seat_id} is not locked.")
            
        expires_at_naive = lock.expires_at.replace(tzinfo=None)
        
        if lock.user_id != current_user.id or expires_at_naive < now_naive:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Seat {seat_id} is not locked by you or the lock has expired."
            )

    # Process booking
    new_booking = Booking(
        user_id=current_user.id,
        event_id=request.event_id,
        status=BookingStatus.CONFIRMED
    )
    db.add(new_booking)
    db.flush()

    # Mark seats as BOOKED and remove locks
    for seat_id in request.seat_ids:
        seat = db.query(Seat).filter(Seat.id == seat_id).first()
        seat.status = SeatStatus.BOOKED
        db.add(BookingSeat(booking_id=new_booking.id, seat_id=seat.id))
        
        lock = db.query(SeatLock).filter(SeatLock.seat_id == seat.id).first()
        if lock:
            db.delete(lock)

    db.commit()
    db.refresh(new_booking)
    return new_booking
