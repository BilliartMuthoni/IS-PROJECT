"""Acquire PlantDoc images for out-of-domain testing.

PlantDoc (Singh et al., 2020; cropped classification release, CC BY 4.0) is
never used for training, so its train/ and test/ folders are pooled. Labels that
match a project class are saved under the PlantVillage name in in_scope/; the
other tomato diseases are saved under their PlantDoc name in unseen/.

As with PlantVillage, the repository is cloned to Colab's local disk and only the
selected images are copied to Drive.
"""

import shutil
import subprocess
from pathlib import Path

REPO_URL = "https://github.com/pratikkayal/PlantDoc-Dataset.git"
SPLITS = ["train", "test"]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def _git(args: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=True
    )
    return result.stdout


def clone_sparse(dest: Path, labels: list[str]) -> Path:
    """Clone only the requested label folders (from both train/ and test/) into dest."""
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)

    _git(["clone", "--filter=blob:none", "--sparse", REPO_URL, str(dest)])
    _git(["sparse-checkout", "init", "--cone"], cwd=dest)
    _git(
        ["sparse-checkout", "set", *[f"{split}/{label}" for split in SPLITS for label in labels]],
        cwd=dest,
    )
    return dest


def list_tracked(repo: Path, folder: str) -> list[str]:
    """Image paths Git says the folder should contain, independent of the disk."""
    # -z avoids Git quoting file names that contain unusual characters.
    listing = _git(["ls-tree", "-r", "-z", "--name-only", "HEAD", folder], cwd=repo)
    return [p for p in listing.split("\0") if Path(p).suffix.lower() in IMAGE_EXTENSIONS]


def copy_to_destination(
    repo: Path, class_map: dict[str, str], unseen_labels: list[str], dest: Path
) -> list[dict]:
    """Copy every image to dest and return one row per image Git tracks."""
    targets = {label: ("in_scope", name) for label, name in class_map.items()}
    targets.update({label: ("unseen", label) for label in unseen_labels})

    rows = []
    for split in SPLITS:
        for label, (subset, name) in targets.items():
            target_dir = dest / subset / name
            target_dir.mkdir(parents=True, exist_ok=True)

            for number, tracked in enumerate(list_tracked(repo, f"{split}/{label}"), start=1):
                src = repo / tracked
                # PlantDoc names are scraped URLs (e.g. "show_picture.asp?id=...&w=524.jpg"),
                # which break on Windows, so each image gets a plain numbered name instead.
                target = target_dir / f"{split}__{number:04d}{src.suffix.lower()}"
                if src.exists():
                    shutil.copy2(src, target)
                rows.append(
                    {
                        "subset": subset,
                        "class": name,
                        "plantdoc_label": label,
                        "plantdoc_split": split,
                        "file": target.relative_to(dest).as_posix(),
                        "original_name": src.name,
                        "copied": target.exists(),
                    }
                )
    return rows
