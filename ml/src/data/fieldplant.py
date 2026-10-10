"""Acquire FieldPlant (Moupojou et al., 2023) and crop its annotated leaves.

The official Roboflow release (version 11) is an object-detection dataset: each
photo holds several boxed leaves. Every box whose label maps unambiguously to one
of the project's classes is cropped into a single-leaf image, matching the
PlantVillage format. The source photo is recorded with each crop so that crops
from the same photo can be kept in the same data partition.
"""

import json
from collections import Counter
from pathlib import Path

from PIL import Image

WORKSPACE = "plant-disease-detection"
PROJECT = "fieldplant"
VERSION = 11


def download(api_key: str, dest: Path) -> Path:
    from roboflow import Roboflow

    version = Roboflow(api_key=api_key).workspace(WORKSPACE).project(PROJECT).version(VERSION)
    dataset = version.download("coco", location=str(dest), overwrite=True)
    return Path(dataset.location)


def crop_leaves(
    coco_root: Path, class_map: dict[str, str], dest: Path, min_size: tuple[int, int]
) -> tuple[list[dict], Counter]:
    """Crop every mapped box into dest/<project class>/; return crop rows and dropped-label counts."""
    rows, dropped = [], Counter()

    for ann_file in sorted(coco_root.rglob("_annotations.coco.json")):
        coco = json.loads(ann_file.read_text())
        names = {c["id"]: c["name"] for c in coco["categories"]}
        images = {i["id"]: i for i in coco["images"]}

        for ann in coco["annotations"]:
            label = names[ann["category_id"]]
            target = class_map.get(label)
            if target is None:
                dropped[label] += 1
                continue

            info = images[ann["image_id"]]
            x, y, w, h = ann["bbox"]
            left, top = max(0, round(x)), max(0, round(y))
            right, bottom = min(info["width"], round(x + w)), min(info["height"], round(y + h))
            if right - left < min_size[0] or bottom - top < min_size[1]:
                dropped[f"{label} (box smaller than {min_size[0]}x{min_size[1]})"] += 1
                continue

            out_dir = dest / target
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{Path(info['file_name']).stem}__{ann['id']}.jpg"
            with Image.open(ann_file.parent / info["file_name"]) as img:
                img.convert("RGB").crop((left, top, right, bottom)).save(out_path, quality=95)

            rows.append({
                "crop": out_path.name,
                "class": target,
                "fieldplant_label": label,
                "source_image": info["file_name"],
                "width": right - left,
                "height": bottom - top,
            })

    return rows, dropped
