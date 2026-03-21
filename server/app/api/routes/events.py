from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse
from app.core.dependencies import get_current_admin

router = APIRouter()

@router.get("/", response_model=List[EventResponse])
def get_events(
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    q: str | None = None,
    venue: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if category and category != "All":
        query = query.filter(Event.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Event.title.ilike(like))
    if venue:
        query = query.filter(Event.venue == venue)
    events = query.offset(skip).limit(limit).all()
    return events

@router.post("/", response_model=EventResponse)
def create_event(event_in: EventCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    event = Event(**event_in.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: UUID, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event_in.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: UUID, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"ok": True}
