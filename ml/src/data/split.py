"""Split the cleaned training pool into train, validation and test without leakage.

Photos of the same leaf or plant look almost identical, so if one landed in train
and another in test the test score would be inflated. Each image therefore gets a
group, and a whole group always goes to one partition. Images are joined into a
group when they share any of:

- a PlantVillage leaf record (4 photos per leaf; maize has no records),
- a FieldPlant source photo (several leaves cropped from one picture),
- a Tanzania capture session (photos taken minutes apart in the same class),
- a near-duplicate group from cleaning (dup_group).

Groups are then dealt into folds with StratifiedGroupKFold, stratified on
source and class together, so every partition keeps each source's class mix.
PlantDoc is never split: it is the out-of-domain test set.
"""

import csv
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

PARTITIONS = ["train", "val", "test"]
MINUTE = pd.Timedelta(minutes=1)


# ------------------------------------------------------------
# PlantVillage leaf records
# ------------------------------------------------------------

def leaf_name(file_name: str) -> str:
    """PlantVillage image names carry a random prefix before "___"; the leaf
    records use only the part after it, without extension, in any case."""
    return Path(file_name.split("___", 1)[-1]).stem.lower().strip()


def read_leaf_maps(folder: Path, classes: list[str]) -> dict[tuple[str, str], str]:
    """(class, leaf_name) -> leaf number, from filtered_leafmaps/<class>.csv where present."""
    leaf_of = {}
    for class_name in classes:
        path = folder / f"{class_name}.csv"
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                leaf_of[(class_name, leaf_name(row["File Name"]))] = row["Leaf #"]
    return leaf_of


# ------------------------------------------------------------
# Tanzania capture sessions
# ------------------------------------------------------------

def _session_numbers(times: pd.Series, gap_minutes: float) -> pd.Series:
    """Number the sessions in one class: a new session starts after a gap longer than the cut-off."""
    ordered = times.sort_values()
    new_session = ordered.diff() > gap_minutes * MINUTE
    return new_session.cumsum().reindex(times.index)


def gap_quantiles(inventory: pd.DataFrame) -> pd.DataFrame:
    """Minutes between consecutive photos in each class, at a few percentiles."""
    rows = {}
    for class_name, part in inventory.dropna(subset=["capture_time"]).groupby("class"):
        gaps = part["capture_time"].sort_values().diff().dropna() / MINUTE
        rows[class_name] = gaps.quantile([0.5, 0.75, 0.9, 0.95, 0.99]).round(2)
    table = pd.DataFrame(rows).T
    table.columns = [f"p{int(q * 100)}" for q in table.columns]
    return table


def gap_table(inventory: pd.DataFrame, sample: pd.DataFrame, cutoffs: list[float]) -> pd.DataFrame:
    """For each class and cut-off: sessions in the full inventory, and how big the
    largest session is within the sample (the images the split actually has to place)."""
    rows = []
    timed = inventory.dropna(subset=["capture_time"])
    for cutoff in cutoffs:
        for class_name, part in timed.groupby("class"):
            numbers = _session_numbers(part["capture_time"], cutoff)
            sizes = numbers.value_counts()
            in_sample = part["file"].isin(sample.loc[sample["class"] == class_name, "file"])
            sample_sizes = numbers[in_sample].value_counts()
            rows.append({
                "cutoff_min": cutoff,
                "class": class_name,
                "sessions": len(sizes),
                "median_size": int(sizes.median()),
                "largest_size": int(sizes.max()),
                "largest_in_sample": int(sample_sizes.max()),
                "largest_share_of_sample": round(sample_sizes.max() / in_sample.sum(), 3),
            })
    return pd.DataFrame(rows)


def assign_sessions(inventory: pd.DataFrame, gap_minutes: dict[str, float]) -> pd.Series:
    """Session id per inventory row, e.g. "Potato___healthy#12"; photos with no
    capture time each get a session of their own."""
    session = pd.Series(index=inventory.index, dtype=object)
    for class_name, part in inventory.groupby("class"):
        timed = part["capture_time"].notna()
        numbers = _session_numbers(part.loc[timed, "capture_time"], gap_minutes[class_name])
        session[numbers.index] = class_name + "#" + numbers.astype(str)
        untimed = part.index[~timed]
        session[untimed] = class_name + "#no-time:" + part.loc[untimed, "file"]
    return session


def session_summary(sample_sessions: pd.DataFrame, gap_minutes: dict[str, float]) -> pd.DataFrame:
    """Per class: cut-off used and session sizes among the sampled images (for Chapter 5)."""
    sizes = sample_sessions.groupby(["class", "session"]).size()
    summary = sizes.groupby("class").agg(images="sum", sessions="size", median_size="median", largest_size="max")
    summary.insert(0, "cutoff_min", [gap_minutes[c] for c in summary.index])
    return summary


# ------------------------------------------------------------
# Groups
# ------------------------------------------------------------

def connect(keys_per_row: list[list]) -> np.ndarray:
    """Union-find: rows sharing any key, directly or through a chain, get the same group number."""
    parent = list(range(len(keys_per_row)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    first_row_with = {}
    for row, keys in enumerate(keys_per_row):
        for key in keys:
            if key in first_row_with:
                a, b = find(row), find(first_row_with[key])
                if a != b:
                    parent[max(a, b)] = min(a, b)
            else:
                first_row_with[key] = row
    roots = np.array([find(row) for row in range(len(keys_per_row))])
    # Renumber 0, 1, 2, ... in order of first appearance so ids stay small and stable.
    return pd.factorize(roots)[0]


def group_keys(pool: pd.DataFrame) -> list[list]:
    """The grouping keys of each row; columns leaf, source_image, session may be missing (NaN)."""
    keys = []
    columns = zip(pool["dup_group"], pool["class"], pool["leaf"], pool["source_image"], pool["session"])
    for dup_group, class_name, leaf, source_image, session in columns:
        row_keys = [("dup", dup_group)]
        if pd.notna(leaf):
            row_keys.append(("leaf", class_name, leaf))
        if pd.notna(source_image):
            row_keys.append(("photo", source_image))
        if pd.notna(session):
            row_keys.append(("session", session))
        keys.append(row_keys)
    return keys


# ------------------------------------------------------------
# Split and checks
# ------------------------------------------------------------

def assign_partitions(pool: pd.DataFrame, folds: int, ratios: tuple[float, float, float], seed: int) -> pd.Series:
    """Deal whole groups into folds balanced on source|class, then map folds to partitions."""
    train_folds, val_folds = round(folds * ratios[0]), round(folds * ratios[1])
    strata = pool["source"] + "|" + pool["class"]
    splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=seed)

    fold = np.empty(len(pool), dtype=int)
    for number, (_, held_out) in enumerate(splitter.split(pool, strata, pool["group"])):
        fold[held_out] = number

    partition = np.where(fold < train_folds, "train", np.where(fold < train_folds + val_folds, "val", "test"))
    return pd.Series(partition, index=pool.index)


def shares(split: pd.DataFrame, by: str) -> pd.DataFrame:
    """Share of each class (or source) that ended up in each partition."""
    counts = split.groupby([by, "partition"]).size().unstack(fill_value=0).reindex(columns=PARTITIONS, fill_value=0)
    return counts.div(counts.sum(axis=1), axis=0)


def check(split: pd.DataFrame, plantdoc_paths: set[str], ratios: tuple[float, float, float], tolerance: float) -> list[str]:
    """Assert the split is leak-free and balanced; returns the passed checks for printing."""
    target = pd.Series(ratios, index=PARTITIONS)
    passed = []

    partitions_per_group = split.groupby("group")["partition"].nunique()
    assert (partitions_per_group == 1).all(), f"{(partitions_per_group > 1).sum()} groups span partitions"
    passed.append(f"Every one of {len(partitions_per_group)} groups sits in a single partition")

    leaked = plantdoc_paths & set(split["path"])
    assert not leaked, f"{len(leaked)} PlantDoc images in train/val/test"
    passed.append("No PlantDoc image is in train, val or test")

    assert split["path"].is_unique, "An image appears twice"
    passed.append("No image appears twice")

    class_shares = shares(split, "class")
    assert (class_shares > 0).all().all(), "A class is missing from a partition:\n" + str(class_shares)
    passed.append("Every class appears in train, val and test")

    for by in ["class", "source"]:
        drift = (shares(split, by) - target).abs().max(axis=1)
        assert (drift <= tolerance).all(), f"{by} shares drift more than {tolerance:.0%}:\n{drift[drift > tolerance]}"
        passed.append(f"Every {by}'s share of each partition is within {tolerance:.0%} of target (worst {drift.max():.1%})")
    return passed


def summary_table(split: pd.DataFrame) -> pd.DataFrame:
    """Images per source x class x partition, with each partition's share of the row."""
    counts = (
        split.groupby(["source", "class", "partition"]).size()
        .unstack(fill_value=0).reindex(columns=PARTITIONS, fill_value=0)
    )
    counts["total"] = counts[PARTITIONS].sum(axis=1)
    for name in PARTITIONS:
        counts[f"{name}_share"] = (counts[name] / counts["total"]).round(3)
    return counts.reset_index()
