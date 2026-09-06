"""Placeholder for the trained multimodal classifier.

Returns a random disease from the crop's class list with a random confidence,
so both branches of the pipeline -- confident diagnosis and low-confidence
referral -- can be exercised before the real model exists.

Replace predict() with inference against the trained model. The contract it must
honour: return (disease_label, calibrated_confidence). Calibration matters here --
the threshold comparison downstream is only meaningful if the confidence reflects
true correctness likelihood.
"""

import random

from app.core.knowledge_base import diseases_for_crop
from app.models.diagnosis import CropType


def predict(crop: CropType, image_path: str, symptoms_text: str | None) -> tuple[str, float]:
    diseases = diseases_for_crop(crop)
    if not diseases:
        return "Unknown", 0.0

    disease = random.choice(diseases)

    # Spread across the threshold so referrals happen roughly a third of the time.
    confidence = round(random.uniform(0.45, 0.98), 4)

    return disease, confidence
