"""Acquire PlantVillage colour images for the classes in scope.

The repository is cloned to Colab's local disk rather than to Google Drive:
Git's many small writes and lock files are unreliable on the Drive mount, which
left earlier clones half-checked-out with stale index.lock files. Only the
finished class folders are copied to Drive.
"""

import shutil
import subprocess
from pathlib import Path

REPO_URL = "https://github.com/spMohanty/PlantVillage-Dataset.git"
COLOR_SUBDIR = "raw/color"
LEAF_GROUPING_SUBDIR = "leaf_grouping"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def _git(args: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=True
    )
    return result.stdout


def clone_sparse(dest: Path, class_names: list[str]) -> Path:
    """Clone only the requested class folders plus leaf groupings into dest."""
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)

    _git(["clone", "--filter=blob:none", "--sparse", REPO_URL, str(dest)])
    _git(["sparse-checkout", "init", "--cone"], cwd=dest)
    _git(
        [
            "sparse-checkout",
            "set",
            LEAF_GROUPING_SUBDIR,
            *[f"{COLOR_SUBDIR}/{name}" for name in class_names],
        ],
        cwd=dest,
    )
    return dest


def count_images(folder: Path) -> int:
    if not folder.exists():
        return 0
    return sum(
        1 for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )


def count_tracked(repo: Path, class_name: str) -> int:
    """Number of images Git says the class should have, independent of the disk."""
    listing = _git(["ls-tree", "-r", "--name-only", "HEAD", f"{COLOR_SUBDIR}/{class_name}"], cwd=repo)
    return sum(
        1 for line in listing.splitlines() if Path(line).suffix.lower() in IMAGE_EXTENSIONS
    )


def copy_to_destination(repo: Path, class_names: list[str], dest: Path) -> list[dict]:
    """Copy each class folder to dest and report on-disk vs expected counts."""
    dest.mkdir(parents=True, exist_ok=True)
    report = []

    for name in class_names:
        src = repo / COLOR_SUBDIR / name
        target = dest / name
        if src.exists():
            shutil.copytree(src, target, dirs_exist_ok=True)

        expected = count_tracked(repo, name)
        copied = count_images(target)
        report.append(
            {"class": name, "expected": expected, "copied": copied, "ok": expected == copied > 0}
        )

    leaf_src = repo / LEAF_GROUPING_SUBDIR
    if leaf_src.exists():
        shutil.copytree(leaf_src, dest / LEAF_GROUPING_SUBDIR, dirs_exist_ok=True)

    return report
