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
    # True when most of the probability belonged to a crop other than the one chosen,
    # so the app can suggest checking the crop. The other crop is never named.
    crop_mismatch: bool = False
    created_at: datetime


class DiagnosisListItem(BaseModel):
    diagnosis_id: int
    crop: CropType
    predicted_disease: Optional[str] = None
    confidence: float
    is_referred: bool
    created_at: datetime

    model_config = {"from_attributes": True}
