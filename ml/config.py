"""Central configuration for the ML pipeline.

Code lives in this Git repository; datasets, checkpoints and reports live on
Google Drive (too large for Git). Override the data location with the
CDD_DATA_ROOT environment variable when running outside Colab.
"""

import os
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

ML_ROOT = Path(__file__).resolve().parent

DATA_ROOT = Path(
    os.environ.get("CDD_DATA_ROOT", "/content/drive/MyDrive/CropDiseaseDiagnosis")
)

DATASETS_DIR = DATA_ROOT / "datasets"
RAW_DATA_DIR = DATASETS_DIR / "raw"
PROCESSED_DIR = DATASETS_DIR / "processed"
SPLITS_DIR = DATASETS_DIR / "splits"
METADATA_DIR = DATASETS_DIR / "metadata"

PLANTVILLAGE_DIR = RAW_DATA_DIR / "plantvillage"
FIELDPLANT_DIR = RAW_DATA_DIR / "fieldplant"
PLANTDOC_DIR = RAW_DATA_DIR / "plantdoc"

MODELS_DIR = DATA_ROOT / "models"
REPORTS_DIR = DATA_ROOT / "reports"
LOGS_DIR = DATA_ROOT / "logs"

# ============================================================
# SCOPE
# ============================================================

CROPS = ["Maize", "Tomato", "Potato"]

# PlantVillage folder names for the classes in scope.
PLANTVILLAGE_CLASSES = [
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
]

# FieldPlant (official Roboflow release, version 11) labels mapped to project
# classes. Only unambiguous matches; every other label is dropped and recorded.
# Original FieldPlant labels in brackets.
FIELDPLANT_CLASS_MAP = {
    "Corn Gray leaf spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",  # Corn_Cercosporiose
    "Corn Healthy": "Corn_(maize)___healthy",  # Corn_Healthy
    "Tomato blight leaf": "Tomato___Late_blight",  # Tomato_Mildiou (French for late blight)
    "Tomato healthy": "Tomato___healthy",  # Tomato_healthy
}

# PlantDoc (cropped classification release) labels mapped to project classes.
# PlantDoc has no healthy maize or healthy potato folder.
PLANTDOC_CLASS_MAP = {
    "Corn Gray leaf spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn rust leaf": "Corn_(maize)___Common_rust_",
    "Corn leaf blight": "Corn_(maize)___Northern_Leaf_Blight",
    "Tomato leaf bacterial spot": "Tomato___Bacterial_spot",
    "Tomato Early blight leaf": "Tomato___Early_blight",
    "Tomato leaf late blight": "Tomato___Late_blight",
    "Tomato leaf": "Tomato___healthy",
    "Potato leaf early blight": "Potato___Early_blight",
    "Potato leaf late blight": "Potato___Late_blight",
}

# Tomato diseases outside the 11 classes: the unseen-class set for testing deferral.
PLANTDOC_UNSEEN_LABELS = [
    "Tomato Septoria leaf spot",
    "Tomato leaf mosaic virus",
    "Tomato leaf yellow virus",
    "Tomato mold leaf",
    "Tomato two spotted spider mites leaf",
]


# ============================================================
# PROCESSING
# ============================================================

IMAGE_SIZE = (224, 224)
MIN_IMAGE_SIZE = (64, 64)
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff"}

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

RANDOM_SEED = 42

# PlantDoc is reserved for out-of-domain evaluation.
PLANTDOC_OUT_OF_DOMAIN_ONLY = True


def ensure_dirs() -> None:
    for folder in [
        PLANTVILLAGE_DIR,
        FIELDPLANT_DIR,
        PLANTDOC_DIR,
        PROCESSED_DIR,
        SPLITS_DIR,
        METADATA_DIR,
        MODELS_DIR,
        REPORTS_DIR,
        LOGS_DIR,
    ]:
        folder.mkdir(parents=True, exist_ok=True)
