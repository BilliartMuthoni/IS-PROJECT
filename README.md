# Confidence-Calibrated Crop Disease Diagnosis

Crop disease diagnosis for smallholder farmers in Kenya, covering maize, tomato and potato.
A multimodal model combines a leaf photo with an optional symptom description and returns a
calibrated confidence score. Confident diagnoses come with treatment guidance from a curated
knowledge base. Uncertain ones are referred to an agricultural extension officer instead of guessing.

## Repository layout

| Folder | What it is | Runs on |
|---|---|---|
| [`ml/`](ml/) | Data preparation, model training, calibration, evaluation | Google Colab (GPU) |
| [`sproutly-backend/`](sproutly-backend/) | FastAPI service: auth, diagnosis endpoint, referral logic, model inference | Python 3.12 |
| [`sproutly-mobile/`](sproutly-mobile/) | React Native (Expo) app for farmers | Node 22 |
| [`sproutly-admin/`](sproutly-admin/) | React (Vite) web portal for administrators | Node 22 |

Datasets and model checkpoints are kept on Google Drive, not in Git. See [`ml/README.md`](ml/README.md).

## Workflow

- Work happens on feature branches and is merged to `main` through pull requests.
- CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request: backend
  lint and compile, ML lint and notebook validation, admin lint and build, and a mobile
  dependency install.
