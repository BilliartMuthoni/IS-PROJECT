from datetime import datetime
from typing import Literal, Optional

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


class MfaCodeRequest(BaseModel):
    mfa_token: str
    code: str

    @field_validator("code")
    @classmethod
    def code_is_six_digits(cls, v: str) -> str:
        # Authenticator apps show the code as "123 456"; accept it either way.
        v = v.replace(" ", "")
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Code must be the 6 digits shown in your authenticator app")
        return v


class MfaSetup(BaseModel):
    # Typed into the authenticator app by hand ("Enter a setup key").
    secret: str
    # otpauth:// link; opening it on the phone adds the account to the authenticator app.
    otpauth_uri: str
    # The same link as a PNG QR code, for setting up from another screen.
    qr_code: str


class MfaChallengeResponse(BaseModel):
    """Password accepted; the app must now send a code to the endpoint in next_step."""

    # "setup": confirm the first code at /auth/mfa/setup/confirm.
    # "verify": send the current code to /auth/mfa/verify.
    next_step: Literal["setup", "verify"]
    mfa_token: str
    expires_in_minutes: int
    setup: Optional[MfaSetup] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole


class OAuthExchangeRequest(BaseModel):
    # One-time login code the backend sent to the app's link after GitHub sign-in.
    code: str
    # PKCE verifier the app generated before opening the browser (RFC 7636: 43-128 characters).
    code_verifier: str

    @field_validator("code_verifier")
    @classmethod
    def verifier_length(cls, v: str) -> str:
        if not 43 <= len(v) <= 128:
            raise ValueError("code_verifier must be 43-128 characters")
        return v


class OAuthLoginResponse(BaseModel):
    """Exactly one is set: tokens to log in, or an authenticator challenge for an
    existing account that already has MFA switched on."""

    tokens: Optional[TokenResponse] = None
    challenge: Optional[MfaChallengeResponse] = None


class CurrentUserResponse(BaseModel):
    user_id: int
    user_phone_number: Optional[str] = None
    user_email: Optional[EmailStr] = None
    role: UserRole
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
