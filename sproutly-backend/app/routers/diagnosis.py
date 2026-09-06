from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.classifier_stub import predict
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.image_intake import save_clean_image
from app.core.knowledge_base import get_guidance
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.diagnosis import CropType, Diagnosis
from app.models.user import User
from app.schemas.diagnosis import DiagnosisListItem, DiagnosisResponse, Guidance

router = APIRouter(prefix="/diagnose", tags=["diagnosis"])

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
    image_path = save_clean_image(image)

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
