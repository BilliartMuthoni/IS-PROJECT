from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sproutly"
    app_env: str = "development"
    debug: bool = True

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    otp_expire_minutes: int = 5
    otp_length: int = 6

    database_url: str

    # Diagnosis
    upload_dir: str = "uploads"
    # Below this calibrated confidence the case is deferred to an extension officer
    # instead of returning a prediction.
    confidence_threshold: float = 0.70

    # Email (OTP delivery). Disabled until SMTP credentials are provided.
    email_enabled: bool = False
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "Sproutly"

    @field_validator("upload_dir")
    @classmethod
    def upload_dir_not_blank(cls, v: str) -> str:
        # A blank value in .env would otherwise override the default and break saving.
        return v.strip() or "uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
