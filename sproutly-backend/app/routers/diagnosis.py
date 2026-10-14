import os
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.classifier import Prediction, predict
from app.core.deps import get_current_user
from app.core.image_intake import save_clean_image
from app.core.knowledge_base import display_name, get_guidance
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.diagnosis import CropType, Diagnosis
from app.models.user import User
from app.schemas.diagnosis import (
    BatchItem,
    BatchResponse,
    CropCorrection,
    DiagnosisListItem,
    DiagnosisResponse,
    Guidance,
)

router = APIRouter(prefix="/diagnose", tags=["diagnosis"])

# Interim wording until the county support-contacts directory exists (Sprint 4).
REFERRAL_MESSAGE = (
    "We can't diagnose this reliably. Please contact agricultural support in your county, "
    "such as your county agriculture office or a local agrovet, before treating the crop."
)
# Several photos at once (#43): enough for a walk through a mixed plot, small enough
# to stay well inside NFR iii (about 0.15 s per photo on the laptop CPU).
MAX_BATCH_PHOTOS = 10


def _apply(record: Diagnosis, prediction: Prediction) -> None:
    """Copy a prediction onto a diagnosis record (new, or re-checked with another crop)."""
    record.crop = prediction.crop
    record.predicted_disease = None if prediction.is_referred else display_name(prediction.class_name)
    record.confidence = prediction.confidence
    record.is_referred = prediction.is_referred


def _response(record: Diagnosis, prediction: Prediction) -> DiagnosisResponse:
    common = dict(
        diagnosis_id=record.diagnosis_id,
        crop=record.crop,
        confidence=record.confidence,
        crop_detected=prediction.crop_detected,
        created_at=record.created_at,
    )
    if prediction.is_referred:
        return DiagnosisResponse(
            **common,
            is_referred=True,
            referral_message=REFERRAL_MESSAGE,
            crop_mismatch=prediction.crop_mismatch,
        )
    guidance = get_guidance(prediction.class_name)
    return DiagnosisResponse(
        **common,
        is_referred=False,
        predicted_disease=record.predicted_disease,
        guidance=Guidance(**guidance) if guidance else None,
    )


def _diagnose(db: Session, user: User, crop: Optional[CropType], image_path: str,
              symptoms_text: Optional[str] = None) -> DiagnosisResponse:
    prediction = predict(crop, image_path)
    record = Diagnosis(user_id=user.user_id, image_path=image_path, symptoms_text=symptoms_text)
    _apply(record, prediction)
    db.add(record)
    db.commit()
    db.refresh(record)
    return _response(record, prediction)


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
    return _diagnose(db, current_user, crop, image_path, symptoms_text)


@router.post("/batch", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_batch(
    request: Request,
    images: List[UploadFile] = File(...),
    crop: Optional[CropType] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Several photos at once (#43). With a crop, every photo is that crop; without one
    (mixed or not sure), each photo's crop is detected and can be corrected afterwards.
    Each photo becomes its own diagnosis, so history needs no changes. A photo that
    cannot be read is reported and skipped; the others are still checked."""
    if not 1 <= len(images) <= MAX_BATCH_PHOTOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Send between 1 and {MAX_BATCH_PHOTOS} photos at a time",
        )

    results = []
    for index, image in enumerate(images):
        try:
            image_path = save_clean_image(image)
        except HTTPException as exc:
            results.append(BatchItem(index=index, error=exc.detail))
            continue
        results.append(BatchItem(index=index, result=_diagnose(db, current_user, crop, image_path)))
    return BatchResponse(results=results)


@router.post("/{diagnosis_id}/crop", response_model=DiagnosisResponse)
@limiter.limit("30/minute")
def correct_crop(
    request: Request,
    diagnosis_id: int,
    payload: CropCorrection,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The farmer says the detected crop was wrong: check the same photo again with their crop.
    With the farmer's crop, accuracy on unfamiliar photos rises from 28% to 40% (see classifier)."""
    record = (
        db.query(Diagnosis)
        .filter(Diagnosis.diagnosis_id == diagnosis_id, Diagnosis.user_id == current_user.user_id)
        .first()
    )
    if not record:
        # Same answer for "not yours" and "does not exist": never confirm other users' records.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnosis not found")
    if not os.path.exists(record.image_path):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The photo is no longer stored. Please check it again with a new photo.",
        )

    prediction = predict(payload.crop, record.image_path)
    _apply(record, prediction)
    db.commit()
    db.refresh(record)
    return _response(record, prediction)


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
