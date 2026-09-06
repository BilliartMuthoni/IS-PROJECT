import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.classifier_stub import predict
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.knowledge_base import get_guidance
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.diagnosis import CropType, Diagnosis
from app.models.user import User
from app.schemas.diagnosis import DiagnosisListItem, DiagnosisResponse, Guidance

router = APIRouter(prefix="/diagnose", tags=["diagnosis"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB


def _save_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG or WebP images are accepted",
        )

    contents = image.file.read()
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large (maximum 8 MB)",
        )

    os.makedirs(settings.upload_dir, exist_ok=True)
    extension = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[image.content_type]
    # Generated name -- never trust the client-supplied filename for a path.
    filename = f"{uuid.uuid4().hex}{extension}"
    path = os.path.join(settings.upload_dir, filename)

    with open(path, "wb") as handle:
        handle.write(contents)

    return path


@router.post("", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_diagnosis(
    request: Request,
    crop: CropType = Form(...),
    symptoms_text: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = _save_image(image)

    disease, confidence = predict(crop, image_path, symptoms_text)
    is_referred = confidence < settings.confidence_threshold

    record = Diagnosis(
        user_id=current_user.user_id,
        crop=crop,
        image_path=image_path,
        symptoms_text=symptoms_text,
        predicted_disease=None if is_referred else disease,
        confidence=confidence,
        is_referred=is_referred,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    if is_referred:
        return DiagnosisResponse(
            diagnosis_id=record.diagnosis_id,
            crop=record.crop,
            confidence=record.confidence,
            is_referred=True,
            referral_message=(
                "We could not identify this with enough certainty to advise you safely. "
                "The case has been sent to an agricultural extension officer for review."
            ),
            created_at=record.created_at,
        )

    guidance = get_guidance(crop, disease)
    return DiagnosisResponse(
        diagnosis_id=record.diagnosis_id,
        crop=record.crop,
        confidence=record.confidence,
        is_referred=False,
        predicted_disease=disease,
        guidance=Guidance(**guidance) if guidance else None,
        created_at=record.created_at,
    )


@router.get("/history", response_model=List[DiagnosisListItem])
def list_diagnoses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Diagnosis)
        .filter(Diagnosis.user_id == current_user.user_id)
        .order_by(Diagnosis.created_at.desc())
        .limit(50)
        .all()
    )
