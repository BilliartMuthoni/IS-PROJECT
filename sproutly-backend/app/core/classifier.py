"""Image-only crop disease classifier (ResNet-50, chosen in the architecture comparison, #41).

Loads a model.pt exported by ml/notebooks/08 or 09: the architecture name, weights,
class list, image size and normalisation, so preprocessing here matches the
evaluation transform used in training exactly. Any architecture from the comparison
can be loaded, so switching models is a matter of changing ML_MODEL_PATH.

Crop rule: the farmer says which crop the photo shows. The model still scores all
11 classes; the answer is the best class *of that crop*, and its confidence is the
original 11-class probability -- deliberately NOT rescaled over the crop's classes.
Rescaling would let a tomato photo submitted as maize come out as a confident maize
diagnosis. Without it, if the model's top class belongs to another crop, the best
class of the chosen crop is below 0.5; since the threshold is never below
MIN_THRESHOLD = 0.5, any disagreement about the crop always ends in a referral.
The rule can only turn diagnoses into referrals, never create one.

Confidence is not calibrated yet; temperature scaling comes in Sprint 4.
"""

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms

from app.core.config import settings
from app.models.diagnosis import CropType

MIN_THRESHOLD = 0.5

# The architectures trained in ml/src/training.py (same names), built without weights;
# the trained weights come from model.pt.
_ARCHITECTURES = {
    "efficientnet_b0": models.efficientnet_b0,
    "mobilenet_v3_large": models.mobilenet_v3_large,
    "resnet50": models.resnet50,
    "densenet121": models.densenet121,
    "convnext_tiny": models.convnext_tiny,
    "swin_t": models.swin_t,
}

# Class-name prefix -> crop, for the PlantVillage class names the model was trained on.
_CROP_PREFIXES = {
    "Corn_(maize)___": CropType.maize,
    "Tomato___": CropType.tomato,
    "Potato___": CropType.potato,
}


def crop_of(class_name: str) -> CropType:
    for prefix, crop in _CROP_PREFIXES.items():
        if class_name.startswith(prefix):
            return crop
    raise ValueError(f"Model class {class_name!r} does not belong to a supported crop")


@dataclass
class Prediction:
    class_name: str  # best class of the chosen crop, e.g. "Tomato___Late_blight"
    confidence: float  # its 11-class probability (not rescaled)
    crop_probability: float  # total probability of all the chosen crop's classes
    is_referred: bool

    @property
    def crop_mismatch(self) -> bool:
        """Most of the probability belongs to another crop."""
        return self.crop_probability < 0.5


def _build(architecture: str, num_classes: int) -> nn.Module:
    """The network with its last Linear layer (the ImageNet output) sized for our classes,
    exactly as ml/src/training.build_model does, so the saved weights fit."""
    if architecture not in _ARCHITECTURES:
        raise ValueError(f"Unsupported model architecture: {architecture!r}")
    network = _ARCHITECTURES[architecture](weights=None)
    name, layer = [(n, m) for n, m in network.named_modules() if isinstance(m, nn.Linear)][-1]
    parent, _, attribute = name.rpartition(".")
    setattr(network.get_submodule(parent), attribute, nn.Linear(layer.in_features, num_classes))
    return network


class _Model:
    def __init__(self, path: Path):
        if not path.exists():
            raise FileNotFoundError(
                f"Model file not found at {path.resolve()}. Download model.pt from Google Drive "
                "(CropDiseaseDiagnosis/models/<run>/model.pt) and put it there, "
                "or set ML_MODEL_PATH in .env."
            )
        saved = torch.load(path, map_location="cpu", weights_only=False)

        self.architecture: str = saved.get("architecture")
        self.classes: list[str] = saved["classes"]
        self.crops = [crop_of(name) for name in self.classes]

        network = _build(self.architecture, len(self.classes))
        network.load_state_dict(saved["state_dict"])
        self.network = network.eval()

        size = saved["image_size"]
        self.transform = transforms.Compose([
            transforms.Resize((size, size)),
            transforms.ToTensor(),
            transforms.Normalize(saved["mean"], saved["std"]),
        ])

    @torch.inference_mode()
    def probabilities(self, image: Image.Image) -> torch.Tensor:
        batch = self.transform(image.convert("RGB")).unsqueeze(0)
        return torch.softmax(self.network(batch), dim=1)[0]


@lru_cache(maxsize=1)
def load_model() -> _Model:
    """Load once per process; called at startup so a missing file fails immediately."""
    return _Model(Path(settings.ml_model_path))


def threshold() -> float:
    return max(settings.confidence_threshold, MIN_THRESHOLD)


def predict(crop: CropType, image_path: str) -> Prediction:
    model = load_model()
    with Image.open(image_path) as image:
        probs = model.probabilities(image)

    in_crop = [i for i, c in enumerate(model.crops) if c == crop]
    best = max(in_crop, key=lambda i: probs[i].item())
    confidence = probs[best].item()
    return Prediction(
        class_name=model.classes[best],
        confidence=confidence,
        crop_probability=sum(probs[i].item() for i in in_crop),
        is_referred=confidence < threshold(),
    )
