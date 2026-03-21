from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ticket Booking System"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/ticket_db"
    SECRET_KEY: str = "supersecretjwtkeyforhackathon"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

settings = Settings()
