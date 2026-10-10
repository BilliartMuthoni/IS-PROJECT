"""Check every acquired image and decide which ones to keep.

Nothing is deleted from Drive: each image gets a keep flag and a reason, and the
split reads the resulting manifest. Rules, applied in order:

1. unreadable: the file does not open or decode fully.
2. too_small: either side is below the minimum size.
3. Exact duplicates (same file bytes), checked separately in the training pool
   and in PlantDoc: copies in two different classes are all dropped
   (duplicate_conflicting_labels); otherwise the first copy is kept (exact_duplicate).
4. PlantDoc images that also appear in the training pool, exactly
   (in_training_sources) or as a near-duplicate (near_duplicate_of_training), are
   dropped so the out-of-domain test never contains a training image.
5. Near-duplicates inside the training pool are kept but share a dup_group, so the
   split can keep them in one partition.
"""

import hashlib
import io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import imagehash
import numpy as np
import pandas as pd
from PIL import Image
from tqdm.auto import tqdm

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
TRAIN_POOL = "train_pool"


def collect(root: Path, source: str, subset: str, classes: list[str] | None = None) -> list[dict]:
    """One row per image in root/<class>/; only the listed classes if given."""
    folders = [root / c for c in classes] if classes else sorted(p for p in root.iterdir() if p.is_dir())
    return [
        {"source": source, "subset": subset, "class": folder.name, "path": path}
        for folder in folders
        for path in sorted(folder.iterdir())
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]


def check_image(path: Path) -> dict:
    row = {"width": None, "height": None, "md5": None, "phash": None, "error": None}
    try:
        data = path.read_bytes()
        row["md5"] = hashlib.md5(data).hexdigest()
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        # verify() does not decode the pixels; convert() does, so truncated files fail here.
        with Image.open(io.BytesIO(data)) as image:
            rgb = image.convert("RGB")
        row["width"], row["height"] = rgb.size
        row["phash"] = str(imagehash.phash(rgb))
    except Exception as err:
        row["error"] = f"{type(err).__name__}: {err}"
    return row


def check_all(paths: list[Path], workers: int = 16) -> list[dict]:
    """Check images in parallel threads; reading from the Drive mount is the slow part."""
    with ThreadPoolExecutor(workers) as pool:
        return list(tqdm(pool.map(check_image, paths), total=len(paths), desc="Checking images"))


def _hash_array(phashes: pd.Series) -> np.ndarray:
    return np.array([int(h, 16) for h in phashes], dtype=np.uint64)


def _close_pairs(a: np.ndarray, b: np.ndarray, max_distance: int, same: bool, chunk: int = 512):
    """Index pairs (i, j) whose hashes differ in at most max_distance bits."""
    pairs = []
    for start in range(0, len(a), chunk):
        distance = np.bitwise_count(a[start:start + chunk, None] ^ b[None, :])
        i, j = np.nonzero(distance <= max_distance)
        i += start
        if same:
            i, j = i[j > i], j[j > i]  # each pair once, and not an image with itself
        pairs.append(np.column_stack([i, j]))
    return np.concatenate(pairs) if pairs else np.empty((0, 2), dtype=int)


def _groups(n: int, pairs: np.ndarray) -> np.ndarray:
    """Union-find: images joined by any chain of near-duplicate pairs share a group."""
    parent = np.arange(n)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, j in pairs:
        root_i, root_j = find(i), find(j)
        if root_i != root_j:
            parent[max(root_i, root_j)] = min(root_i, root_j)
    return np.array([find(x) for x in range(n)])


def _drop(df: pd.DataFrame, index, reason: str) -> None:
    df.loc[index, "keep"] = False
    df.loc[index, "reason"] = reason


def _drop_exact_duplicates(df: pd.DataFrame, pool_mask: pd.Series) -> None:
    candidates = df[pool_mask & df["keep"]]
    for _, copies in candidates.groupby("md5"):
        if len(copies) < 2:
            continue
        if copies["class"].nunique() > 1:
            _drop(df, copies.index, "duplicate_conflicting_labels")
        else:
            _drop(df, copies.index[1:], "exact_duplicate")


def clean(df: pd.DataFrame, min_size: tuple[int, int], max_distance: int) -> pd.DataFrame:
    """Apply the rules in the module docstring; returns df with keep, reason and dup_group."""
    df = df.sort_values("path").reset_index(drop=True)
    df["keep"] = True
    df["reason"] = ""
    df["dup_group"] = pd.NA

    _drop(df, df.index[df["error"].notna()], "unreadable")
    small = df["keep"] & ((df["width"] < min_size[0]) | (df["height"] < min_size[1]))
    _drop(df, df.index[small], "too_small")

    in_pool = df["subset"] == TRAIN_POOL
    _drop_exact_duplicates(df, in_pool)
    _drop_exact_duplicates(df, ~in_pool)

    pool = df[in_pool & df["keep"]]
    plantdoc = df[~in_pool & df["keep"]]
    _drop(df, plantdoc.index[plantdoc["md5"].isin(df.loc[in_pool, "md5"])], "in_training_sources")

    plantdoc = df[~in_pool & df["keep"]]
    pool_hashes = _hash_array(pool["phash"])
    near = _close_pairs(_hash_array(plantdoc["phash"]), pool_hashes, max_distance, same=False)
    _drop(df, plantdoc.index[np.unique(near[:, 0])], "near_duplicate_of_training")

    pairs = _close_pairs(pool_hashes, pool_hashes, max_distance, same=True)
    df.loc[pool.index, "dup_group"] = _groups(len(pool), pairs)
    df["dup_group"] = df["dup_group"].astype("Int64")
    return df
