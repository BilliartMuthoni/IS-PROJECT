from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_mfa_token,
    decode_token,
    new_totp_secret,
    encrypt_secret,
    decrypt_secret,
    provisioning_uri,
    qr_code_data_uri,
    verify_totp,
)
from app.db.session import get_db
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    MfaCodeRequest,
    MfaChallengeResponse,
    MfaSetup,
    TokenResponse,
    CurrentUserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_user_by_identifier(db: Session, phone_number: Optional[str], email: Optional[str]) -> Optional[User]:
    query = db.query(User)
    if phone_number:
        return query.filter(User.user_phone_number == phone_number).first()
    return query.filter(User.user_email == email).first()


def _start_setup(db: Session, user: User) -> MfaChallengeResponse:
    """Give the user a new authenticator secret to add to their app.

    Only reached while MFA is still off, so replacing an unconfirmed secret
    can't lock anyone out.
    """
    secret = new_totp_secret()
    user.totp_secret_encrypted = encrypt_secret(secret)
    user.totp_last_used_step = None
    db.commit()

    uri = provisioning_uri(secret, user.user_phone_number or user.user_email)
    minutes = settings.mfa_setup_token_expire_minutes
    return MfaChallengeResponse(
        next_step="setup",
        mfa_token=create_mfa_token(str(user.user_id), "mfa_setup", minutes),
        expires_in_minutes=minutes,
        setup=MfaSetup(secret=secret, otpauth_uri=uri, qr_code=qr_code_data_uri(uri)),
    )


def _user_from_mfa_token(db: Session, token: str, expected_type: str) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != expected_type or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This step has expired. Please log in again.",
        )
    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
    if not user or not user.is_active or not user.totp_secret_encrypted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This step has expired. Please log in again.",
        )
    return user


def _check_code(db: Session, user: User, code: str) -> None:
    step = verify_totp(decrypt_secret(user.totp_secret_encrypted), code, user.totp_last_used_step)
    if step is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wrong or expired code")
    user.totp_last_used_step = step
    db.commit()


def _issue_tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(subject=str(user.user_id), role=user.role.value),
        refresh_token=create_refresh_token(subject=str(user.user_id)),
        role=user.role,
    )


@router.post("/register", response_model=MfaChallengeResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = _get_user_by_identifier(db, payload.phone_number, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number or email already exists",
        )

    user = User(
        user_phone_number=payload.phone_number,
        user_email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # The account can't log in until the first authenticator code is confirmed.
    return _start_setup(db, user)


@router.post("/login", response_model=MfaChallengeResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = _get_user_by_identifier(db, payload.phone_number, payload.email)
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        # Same error for "no such user" and "wrong password" -- never reveal which one.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Accounts from before MFA, or whose setup was never finished, set it up now.
    if not user.mfa_enabled:
        return _start_setup(db, user)

    minutes = settings.mfa_token_expire_minutes
    return MfaChallengeResponse(
        next_step="verify",
        mfa_token=create_mfa_token(str(user.user_id), "mfa_login", minutes),
        expires_in_minutes=minutes,
    )


@router.post("/mfa/setup/confirm", response_model=TokenResponse)
@limiter.limit("5/minute")
def confirm_mfa_setup(request: Request, payload: MfaCodeRequest, db: Session = Depends(get_db)):
    user = _user_from_mfa_token(db, payload.mfa_token, "mfa_setup")
    if user.mfa_enabled:
        # A setup token must not be usable once MFA is on.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This step has expired. Please log in again.",
        )

    # A correct code proves the secret reached the authenticator app.
    _check_code(db, user, payload.code)
    user.mfa_enabled = True
    user.is_verified = True
    db.commit()
    return _issue_tokens(user)


@router.post("/mfa/verify", response_model=TokenResponse)
@limiter.limit("5/minute")
def verify_mfa(request: Request, payload: MfaCodeRequest, db: Session = Depends(get_db)):
    user = _user_from_mfa_token(db, payload.mfa_token, "mfa_login")
    if not user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This step has expired. Please log in again.",
        )

    _check_code(db, user, payload.code)
    return _issue_tokens(user)


@router.get("/me", response_model=CurrentUserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
