from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.user import UserRole


class _RequiresIdentifier(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None

    @model_validator(mode="after")
    def check_identifier_present(self):
        if not self.phone_number and not self.email:
            raise ValueError("Either phone_number or email is required")
        return self


class RegisterRequest(_RequiresIdentifier):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class LoginRequest(_RequiresIdentifier):
    password: str


class ResendOtpRequest(_RequiresIdentifier):
    pass


class VerifyOtpRequest(_RequiresIdentifier):
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_is_six_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit code")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole


class OtpSentResponse(BaseModel):
    message: str
    expires_in_minutes: int
