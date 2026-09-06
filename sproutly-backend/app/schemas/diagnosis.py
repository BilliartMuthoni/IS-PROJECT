from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.diagnosis import CropType


class Guidance(BaseModel):
    summary: str
    treatment: List[str]
    prevention: List[str]


class DiagnosisResponse(BaseModel):
    diagnosis_id: int
    crop: CropType
    confidence: float
    is_referred: bool
    # Present only when the system was confident enough to answer.
    predicted_disease: Optional[str] = None
    guidance: Optional[Guidance] = None
    # Present only when the case was deferred.
    referral_message: Optional[str] = None
    created_at: datetime


class DiagnosisListItem(BaseModel):
    diagnosis_id: int
    crop: CropType
    predicted_disease: Optional[str] = None
    confidence: float
    is_referred: bool
    officer_response: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
