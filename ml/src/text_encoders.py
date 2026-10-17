"""Turn symptom sentences into fixed-length vectors for the fusion model.

Every encoder is frozen: with about 50 training sentences, updating a language
model's weights would only memorise them. Each sentence is encoded once; the
fusion heads then train on the saved vectors.

Candidates (Stage 1 of notebook 11), chosen to cover different kinds of model:

- ``tfidf``: word counts weighted by rarity, no neural network. The baseline.
- ``distilbert``: general language model; the Chapter 3 default.
- ``bert_base``: the larger model DistilBERT was distilled from.
- ``minilm``: small model trained to compare sentences; fast on a CPU.
- ``mpnet``: the strongest of the general sentence-comparison models.
- ``scibert``: BERT trained on scientific papers, including biology (Beltagy,
  Lo and Cohan, 2019; Apache-2.0). An agriculture BERT was considered and
  excluded because its model card states no licence or authors.

The language models use mean pooling: the average of the token vectors, ignoring
padding, which is the usual way to get one vector per sentence.
"""

import time

import numpy as np

ENCODERS = {
    "tfidf": None,
    "distilbert": "distilbert-base-uncased",
    "bert_base": "bert-base-uncased",
    "minilm": "sentence-transformers/all-MiniLM-L6-v2",
    "mpnet": "sentence-transformers/all-mpnet-base-v2",
    "scibert": "allenai/scibert_scivocab_uncased",
}


def _tfidf(train_texts: list[str], texts: list[str]) -> np.ndarray:
    from sklearn.feature_extraction.text import TfidfVectorizer

    # Fitted on training sentences only, so held-out wording does not shape the vocabulary.
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True).fit(train_texts)
    return vectorizer.transform(texts).toarray().astype(np.float32)


def load(name: str, device: str = "cpu"):
    """Tokenizer and frozen model for a language-model encoder."""
    from transformers import AutoModel, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(ENCODERS[name])
    model = AutoModel.from_pretrained(ENCODERS[name]).to(device).eval()
    return tokenizer, model


def _mean_pooled(tokenizer, model, texts: list[str], device: str, batch_size: int = 32) -> np.ndarray:
    import torch

    vectors = []
    with torch.no_grad():
        for start in range(0, len(texts), batch_size):
            batch = tokenizer(texts[start:start + batch_size], padding=True, truncation=True,
                              max_length=128, return_tensors="pt").to(device)
            tokens = model(**batch).last_hidden_state
            mask = batch["attention_mask"].unsqueeze(-1).float()
            vectors.append(((tokens * mask).sum(1) / mask.sum(1)).cpu().numpy())
    return np.concatenate(vectors).astype(np.float32)


def encode(name: str, texts: list[str], train_texts: list[str], device: str = "cpu") -> np.ndarray:
    """One vector per sentence in ``texts``."""
    if name not in ENCODERS:
        raise ValueError(f"Unknown encoder {name!r}; choose from {sorted(ENCODERS)}")
    if name == "tfidf":
        return _tfidf(train_texts, texts)
    tokenizer, model = load(name, device)
    return _mean_pooled(tokenizer, model, texts, device)


def cpu_milliseconds_per_sentence(name: str, sentence: str, threads: int = 2, runs: int = 30) -> float:
    """Median CPU time to encode one sentence, as the backend would (no GPU)."""
    import torch

    if name == "tfidf":
        return 0.0  # a dictionary lookup; negligible next to the image model
    tokenizer, model = load(name, "cpu")
    previous = torch.get_num_threads()
    torch.set_num_threads(threads)
    try:
        for _ in range(3):
            _mean_pooled(tokenizer, model, [sentence], "cpu")
        times = []
        for _ in range(runs):
            began = time.perf_counter()
            _mean_pooled(tokenizer, model, [sentence], "cpu")
            times.append((time.perf_counter() - began) * 1000)
    finally:
        torch.set_num_threads(previous)
    return float(np.median(times))
