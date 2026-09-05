from sqlalchemy import Column, String, Integer, Boolean, DateTime
from datetime import datetime, timezone
from app.db.session import Base 

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True, nullable=True)
    user_phone_number = Column(String, unique=True, index=True, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at=Column(DateTime, default=lambda: datetime.now(timezone.utc))


