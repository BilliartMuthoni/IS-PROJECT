import enum

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SqlEnum
from datetime import datetime, timezone
from app.db.session import Base


class UserRole(str, enum.Enum):
    farmer = "farmer"
    officer = "officer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True, nullable=True)
    user_phone_number = Column(String, unique=True, index=True, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)

    role = Column(SqlEnum(UserRole, name="user_role"), nullable=False, default=UserRole.farmer)

    hashed_otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)

    is_active = Column(Boolean, default=True)
    created_at=Column(DateTime, default=lambda: datetime.now(timezone.utc))


