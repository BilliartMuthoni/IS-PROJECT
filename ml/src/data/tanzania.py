"""Acquire a sample of the Tanzania Irish potato field images.

"Irish Potato Imagery Dataset for Early Detection of Crop Diseases" (Laizer,
Mduma et al., 2023; Zenodo record 8286529, CC BY 4.0): 58,709 smartphone photos
from smallholder farms in Mbeya, Tanzania. The zips (about 7 GB) are downloaded
to Colab's local disk; only the sampled images are copied to Drive.

File names are sequence numbers with no farm or plant ID, so the capture time
from each photo's EXIF data is recorded for grouping photos of the same plant
when the data is split.
"""

import hashlib
import io
import json
import shutil
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

RECORD_URL = "https://zenodo.org/api/records/8286529"
EXIF_IFD = 0x8769
DATETIME_ORIGINAL = 36867
DATETIME = 306
# EXIF sits at the start of a JPEG; this is enough to read it and the image size.
HEADER_BYTES = 256 * 1024


def _md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(zip_names: list[str], dest: Path) -> dict[str, Path]:
    """Download each zip and check it against Zenodo's MD5 checksum."""
    dest.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(RECORD_URL) as response:
        files = {f["key"]: f for f in json.load(response)["files"]}

    paths = {}
    for name in zip_names:
        entry = files[f"{name}.zip"]
        expected = entry["checksum"].removeprefix("md5:")
        path = dest / f"{name}.zip"
        if not (path.exists() and _md5(path) == expected):
            with urllib.request.urlopen(entry["links"]["self"]) as response, path.open("wb") as f:
                shutil.copyfileobj(response, f, length=1 << 20)
            if _md5(path) != expected:
                raise RuntimeError(f"{path.name} does not match Zenodo's checksum")
        paths[name] = path
    return paths


def _image_names(archive: zipfile.ZipFile, folder: str) -> list[str]:
    # Skip the macOS "__MACOSX/._*" metadata entries that come with the zips.
    return [
        n for n in archive.namelist()
        if n.startswith(f"{folder}/") and n.lower().endswith((".jpg", ".jpeg", ".png"))
    ]


def read_inventory(zip_path: Path, folder: str) -> list[dict]:
    """One row per image: file name, capture time from EXIF, and size."""
    rows = []
    with zipfile.ZipFile(zip_path) as archive:
        for name in _image_names(archive, folder):
            with archive.open(name) as f:
                header = f.read(HEADER_BYTES)
            row = {"file": Path(name).name, "capture_time": None, "width": None, "height": None}
            try:
                image = Image.open(io.BytesIO(header))
                exif = image.getexif()
                taken = exif.get_ifd(EXIF_IFD).get(DATETIME_ORIGINAL) or exif.get(DATETIME)
                row.update(capture_time=taken, width=image.width, height=image.height)
            except Exception:
                pass  # Unreadable here; the cleaning step checks every image properly.
            rows.append(row)
    return rows


def extract(zip_path: Path, folder: str, file_names: list[str], dest: Path) -> int:
    """Copy the named images from the zip into dest and return how many arrived."""
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as archive:
        for file_name in file_names:
            with archive.open(f"{folder}/{file_name}") as src, (dest / file_name).open("wb") as out:
                shutil.copyfileobj(src, out)
    return sum(1 for f in file_names if (dest / f).exists())
