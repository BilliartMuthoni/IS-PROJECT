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

    # Authenticator-app MFA (TOTP, RFC 6238). The key encrypts each user's secret
    # at rest; a Fernet key from cryptography.fernet.Fernet.generate_key().
    totp_encryption_key: str
    totp_issuer: str = "Sproutly"
    # Lifetime of the token that links the password step to the code step.
    mfa_token_expire_minutes: int = 5
    mfa_setup_token_expire_minutes: int = 10

    database_url: str

    # Browser origins allowed to call the API (the admin web app). The mobile app
    # is not a browser client and is unaffected.
    cors_origins: list[str] = ["http://localhost:5173"]

    # Diagnosis
    upload_dir: str = "uploads"
    # Trained image model exported by ml/notebooks/08_image_baseline.ipynb (not in Git).
    ml_model_path: str = "models/image_baseline/model.pt"
    # Below this confidence the farmer is referred to support contacts instead of
    # getting a diagnosis. Provisional until calibration in Sprint 4; the classifier
    # never uses a value below 0.5 (see app/core/classifier.py).
    confidence_threshold: float = 0.90

    @field_validator("upload_dir")
    @classmethod
    def upload_dir_not_blank(cls, v: str) -> str:
        # A blank value in .env would otherwise override the default and break saving.
        return v.strip() or "uploads"

    @field_validator("ml_model_path")
    @classmethod
    def ml_model_path_not_blank(cls, v: str) -> str:
        return v.strip() or "models/image_baseline/model.pt"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
