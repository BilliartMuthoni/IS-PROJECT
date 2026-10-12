from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.classifier import predict
from app.core.deps import get_current_user
from app.core.image_intake import save_clean_image
from app.core.knowledge_base import display_name, get_guidance
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.diagnosis import CropType, Diagnosis
from app.models.user import User
from app.schemas.diagnosis import DiagnosisListItem, DiagnosisResponse, Guidance

router = APIRouter(prefix="/diagnose", tags=["diagnosis"])

# Interim wording until the county support-contacts directory exists (Sprint 4).
REFERRAL_MESSAGE = (
    "We can't diagnose this reliably. Please contact agricultural support in your county, "
    "such as your county agriculture office or a local agrovet, before treating the crop."
)

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

    # Image-only model for now; symptoms_text is stored and used by the fusion model in Sprint 3.
    prediction = predict(crop, image_path)
    disease = display_name(prediction.class_name)

    record = Diagnosis(
        user_id=current_user.user_id,
        crop=crop,
        image_path=image_path,
        symptoms_text=symptoms_text,
        predicted_disease=None if prediction.is_referred else disease,
        confidence=prediction.confidence,
        is_referred=prediction.is_referred,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    if prediction.is_referred:
        return DiagnosisResponse(
            diagnosis_id=record.diagnosis_id,
            crop=record.crop,
            confidence=record.confidence,
            is_referred=True,
            referral_message=REFERRAL_MESSAGE,
            crop_mismatch=prediction.crop_mismatch,
            created_at=record.created_at,
        )

    guidance = get_guidance(prediction.class_name)
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
