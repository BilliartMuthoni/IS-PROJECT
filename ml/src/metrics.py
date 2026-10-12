"""Classification and calibration metrics shared by every model.

Calibration asks: when the model says "90% sure", is it right about 90% of the
time? Expected calibration error (ECE) measures the gap, averaged over bins of
confidence. It is reported before calibration here and after it in Sprint 4.
"""

import numpy as np
from sklearn.metrics import accuracy_score, f1_score


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


def expected_calibration_error(confidence: np.ndarray, correct: np.ndarray, bins: int = 15) -> float:
    """Weighted average of |accuracy - mean confidence| over equal-width confidence bins."""
    edges = np.linspace(0, 1, bins + 1)
    which = np.clip(np.digitize(confidence, edges[1:-1]), 0, bins - 1)
    error = 0.0
    for b in range(bins):
        in_bin = which == b
        if in_bin.any():
            error += in_bin.mean() * abs(correct[in_bin].mean() - confidence[in_bin].mean())
    return float(error)


def summarise(logits: np.ndarray, labels: np.ndarray, num_classes: int) -> dict:
    """Accuracy, macro-F1, ECE and negative log-likelihood for labelled predictions."""
    probs = softmax(logits)
    predicted = probs.argmax(axis=1)
    confidence = probs.max(axis=1)
    correct = predicted == labels
    return {
        "images": len(labels),
        "accuracy": accuracy_score(labels, predicted),
        "macro_f1": f1_score(labels, predicted, average="macro", labels=sorted(set(labels)), zero_division=0),
        "ece": expected_calibration_error(confidence, correct),
        "nll": float(-np.log(probs[np.arange(len(labels)), labels] + 1e-12).mean()),
        "mean_confidence": float(confidence.mean()),
    }
