import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_otp_email(to_email: str, otp: str) -> bool:
    """Send an OTP to the given email address.

    Returns True if the message was handed to the SMTP server, False otherwise.
    Never raises -- a failed send must not take down the request that triggered it.
    """
    if not settings.email_enabled:
        print(f"[EMAIL DISABLED] would have sent OTP {otp} to {to_email}")
        return False

    if not settings.smtp_user or not settings.smtp_password:
        print("[EMAIL ERROR] EMAIL_ENABLED is true but SMTP_USER/SMTP_PASSWORD are not set")
        return False

    message = EmailMessage()
    message["Subject"] = "Your Sproutly verification code"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    message["To"] = to_email
    message.set_content(
        f"Your Sproutly verification code is: {otp}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n\n"
        "If you didn't request this code, you can safely ignore this email."
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
        print(f"[EMAIL SENT] OTP delivered to {to_email}")
        return True
    except Exception as exc:
        # Log without leaking the OTP or credentials into the error path.
        print(f"[EMAIL ERROR] could not send to {to_email}: {type(exc).__name__}: {exc}")
        return False
