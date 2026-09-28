# ML Pipeline

Training, calibration and evaluation for the multimodal crop disease classifier
(maize, tomato, potato). The backend only runs inference against the exported
model; nothing here is imported by the app at runtime.

## Where things live

| What | Where | In Git |
|---|---|---|
| Code, notebooks, config | this repository, cloned into Drive at `MyDrive/crop-disease-detection` | yes |
| Datasets, checkpoints, reports, logs | Drive at `MyDrive/CropDiseaseDiagnosis` | no — too large |

All computation runs in Colab; nothing needs to run locally.

`config.py` points at Drive by default. Set `CDD_DATA_ROOT` to use another location.

## Layout

```
ml/
├── config.py            paths, class list, split ratios, seed
├── requirements.txt     pinned to the verified Colab environment
├── notebooks/
│   ├── 01_environment_setup.ipynb
│   └── 02_data_acquisition.ipynb
└── src/
    ├── github_sync.py   commit and push from Colab
    └── data/
        └── plantvillage.py
```

## Working in Colab

**First time only**

1. Add two Colab secrets (key icon, left sidebar): `GITHUB_TOKEN` (a GitHub personal
   access token with repo access) and `GIT_EMAIL`.
2. Open `01_environment_setup.ipynb` from GitHub (**File → Open notebook → GitHub**)
   and run it. It clones this repository into Drive.

**Every session after that**

1. Open notebooks from Drive: `MyDrive/crop-disease-detection/ml/notebooks/`.
2. Runtime → Change runtime type → **T4 GPU**. Run top to bottom.
3. When a piece of work is done: save the notebook (Ctrl+S), set the commit message
   in the last cell, and run it to push.

If you also edit the repository on your laptop, `git pull` in the Drive clone
before working in Colab, so the two copies don't diverge.

## Datasets

| Source | Role | Status |
|---|---|---|
| PlantVillage | training (lab conditions) | notebook 02 |
| FieldPlant | training (field conditions) | pending |
| PlantDoc | out-of-domain evaluation only | pending |
