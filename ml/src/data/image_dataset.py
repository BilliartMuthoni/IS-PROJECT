"""Load the split images for training and evaluation.

Reading thousands of images from the Drive mount every epoch is slow, so the
images in the split CSVs are first copied once to Colab's local disk, shrunk so
the shorter side is CACHE_SHORT_SIDE pixels (the model sees 224x224 anyway).
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms
from tqdm.auto import tqdm

CACHE_SHORT_SIDE = 256
# ImageNet statistics, which the pretrained EfficientNet expects.
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)


def _cache_one(src: Path, dst: Path) -> bool:
    if dst.exists():
        return True
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as image:
        image = image.convert("RGB")
        scale = CACHE_SHORT_SIDE / min(image.size)
        if scale < 1:
            image = image.resize((round(image.width * scale), round(image.height * scale)), Image.BICUBIC)
        image.save(dst, quality=95)
    return dst.exists()


def cache_images(paths: list[str], src_root: Path, dst_root: Path, workers: int = 16) -> int:
    """Copy (and shrink) each image from src_root/path to dst_root/path; returns how many are cached."""
    jobs = [(src_root / p, dst_root / p) for p in paths]
    with ThreadPoolExecutor(workers) as pool:
        done = list(tqdm(pool.map(lambda job: _cache_one(*job), jobs), total=len(jobs), desc="Caching images"))
    return sum(done)


def train_transform(size: int = 224) -> transforms.Compose:
    """Light augmentation: a random crop of most of the leaf, flips, small rotations and colour changes."""
    return transforms.Compose([
        transforms.RandomResizedCrop(size, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])


def eval_transform(size: int = 224) -> transforms.Compose:
    """No randomness: the whole image resized to size x size."""
    return transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])


class SplitDataset(Dataset):
    """Images listed in a split CSV (path, class, ...), read from root.

    Rows whose class is not in classes (PlantDoc's unseen diseases) get label -1.
    """

    def __init__(self, rows: pd.DataFrame, root: Path, classes: list[str], transform):
        self.rows = rows.reset_index(drop=True)
        self.root = root
        self.index_of = {name: i for i, name in enumerate(classes)}
        self.transform = transform

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, i: int):
        row = self.rows.iloc[i]
        with Image.open(self.root / row["path"]) as image:
            tensor = self.transform(image.convert("RGB"))
        return tensor, self.index_of.get(row["class"], -1)
