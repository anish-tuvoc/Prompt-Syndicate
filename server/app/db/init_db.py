import logging
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User, Admin
from app.models.event import Event
from app.models.seat import Seat, SeatStatus
from app.models.booking import Booking, BookingStatus
from app.models.seat_lock import SeatLock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db(db: Session) -> None:
    # 1. Create tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

    # 2. Seed Admin User
    admin_user = db.query(Admin).filter(Admin.username == "admin").first()
    if not admin_user:
        hashed_password = pwd_context.hash("admin")
        admin_user = Admin(
            username="admin",
            password_hash=hashed_password
        )
        db.add(admin_user)
        db.commit()
        logger.info("Default admin user (admin/admin) created successfully.")
    else:
        logger.info("Admin user already exists.")

if __name__ == "__main__":
    db = SessionLocal()
    init_db(db)
    db.close()
