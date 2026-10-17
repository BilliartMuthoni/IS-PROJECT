"""Collect symptom descriptions for the text branch from openly licensed sources.

Two sources, both CC BY-SA, so the text may be reused if the source is credited
and the descriptions file is shared under the same licence (CC BY-SA 4.0):

- CABI Plantwise "Factsheets for Farmers" (PDFs, CC BY-SA 4.0, stated on each
  sheet). The "Recognize the problem" section describes what the disease looks
  like. This is the main source: written for farmers, mostly East African.
- PlantVillage (Penn State) crop pages, whose content is CC BY-SA 3.0 under the
  site's Terms of Service (plantvillage.psu.edu/tos, section 8). Its "Symptoms"
  section fills the diseases Plantwise has no farmer sheet for.

The text is copied word for word, one sentence per row, with disease and
pathogen names replaced by "the disease" so the text model learns from symptoms
rather than names. Every row is reviewed by hand (the ``keep`` column) before it
is used; generated text is not used (Chapter 3). Healthy leaves are described by
neither source, so the healthy classes have no text.

Pages are downloaded one at a time with a pause and an honest user agent; a page
that is blocked or not CC-licensed is skipped, never worked around. Each
source's management advice is saved separately for the treatment knowledge base
(Sprint 3). Splits are by source document, set in ``sources.csv``, so no
document's wording appears in both training and evaluation.
"""

import csv
import html as html_lib
import re
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

USER_AGENT = "Sproutly student research project (Strathmore University); contact via GitHub"
PAUSE_SECONDS = 5
LICENCE = re.compile(r"CC[\s-]?BY(?:[\s-]?SA)?[\s-]?\d\.\d", re.I)
CREATED = re.compile(r"Created in ([A-Z][A-Za-z ]+?),\s*([A-Z][a-z]+ \d{4})")
SCIENTIFIC = re.compile(r"Scientific name\(s\)\s*>\s*(.+)")
# Section headings that end "Recognize the problem" (the first one found wins).
NEXT_HEADINGS = ("Background", "Management", "Prevention", "Control", "Monitoring", "Direct control")
SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z])")
# PlantVillage states its licence once, site-wide, in its Terms of Service.
PLANTVILLAGE_LICENCE = "CC BY-SA 3.0 (plantvillage.psu.edu/tos)"

# Names that would give the class away; replaced with a neutral phrase.
DISEASE_NAMES = [
    "late blight", "early blight", "bacterial leaf spot", "bacterial spot", "grey leaf spot",
    "gray leaf spot", "cercospora leaf spot", "northern leaf blight", "northern corn leaf blight",
    "turcicum leaf blight", "leaf blight", "common rust", "rust", "blight", "barafu",
    "NCLB", "NLB", "GLS", "Exserohilum turcicum", "Setosphaeria turcica", "Cercospora zeina",
]
ROW_COLUMNS = [
    "class_name", "split", "factsheet_id", "sentence", "text", "keep",
    "source_title", "country", "created", "licence", "url",
]


@dataclass
class Factsheet:
    factsheet_id: str
    title: str
    country: str
    created: str
    licence: str
    recognize: list[str]  # the symptom passage, one sentence per item
    management: str
    scientific_names: list[str]


def _cache_name(url: str) -> str:
    """A file name for the cached copy: the PDF's own name, or the crop for PlantVillage."""
    if "plantvillage.psu.edu/topics/" in url:
        return "plantvillage-" + url.split("/topics/")[1].split("/")[0] + ".html"
    return url.rsplit("/", 1)[-1]


def download(url: str, dest: Path) -> Path:
    """Download one page unless it is already cached; pause after each real download."""
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / _cache_name(url)
    if path.exists():
        return path
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        path.write_bytes(response.read())
    time.sleep(PAUSE_SECONDS)
    return path


def sentences(text: str) -> list[str]:
    return [s.strip() for s in SENTENCE_END.split(text) if s.strip()]


# ---------------------------------------------------------------- Plantwise PDFs

def _lines(pdf: Path) -> list[str]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(pdf).pages)
    return [line.strip() for line in text.splitlines() if line.strip()]


def _section(lines: list[str], start: str, stops: tuple[str, ...]) -> str:
    """Text after the ``start`` heading up to the next heading in ``stops``."""
    begin = next((i for i, line in enumerate(lines) if line.lower() == start.lower()), None)
    if begin is None:
        return ""
    body = []
    for line in lines[begin + 1:]:
        if any(line.lower().startswith(s.lower()) and len(line) < 40 for s in stops):
            break
        body.append(line)
    # PDF lines wrap mid-sentence; join them back into running text.
    return re.sub(r"\s+", " ", " ".join(body)).strip()


def parse_plantwise(pdf: Path) -> Factsheet:
    lines = _lines(pdf)
    text = "\n".join(lines)
    # The header is split into one fragment per line ("Created in", "Kenya", ",", ...).
    created = CREATED.search(re.sub(r"\s*\n\s*", " ", text).replace(" ,", ","))
    licence = LICENCE.search(text)
    scientific = SCIENTIFIC.search(text)
    heading = next((i for i, line in enumerate(lines) if line.lower() == "recognize the problem"), None)
    return Factsheet(
        factsheet_id=pdf.stem,
        title=lines[heading - 1] if heading else "",
        country=created.group(1).strip() if created else "",
        created=created.group(2) if created else "",
        licence=licence.group(0) if licence else "",
        recognize=sentences(_section(lines, "Recognize the problem", NEXT_HEADINGS)),
        management=_section(lines, "Management", ("When using a pesticide", "Scientific name")),
        scientific_names=with_genera([n.strip() for n in re.split(r"[;,]", scientific.group(1))]) if scientific else [],
    )


# ---------------------------------------------------------- PlantVillage pages

def _plain(fragment: str) -> str:
    return re.sub(r"\s+", " ", html_lib.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def _items(fragment: str) -> list[str]:
    """Paragraphs and list items as sentences; "a; b" clauses become separate sentences."""
    parts = re.findall(r"<(?:p|li)[^>]*>(.*?)</(?:p|li)>", fragment, re.S) or [fragment]
    out = []
    for part in parts:
        for clause in re.split(r";|\n", _plain(part)):
            clause = clause.strip(" -–•").strip()
            if len(clause) > 3:
                clause = clause[0].upper() + clause[1:]
                out.extend(sentences(clause if clause[-1] in ".!?" else clause + "."))
    return out


def parse_plantvillage(page: Path, section: str, url: str) -> Factsheet:
    """The ``section`` disease's Symptoms and Management from a PlantVillage crop page."""
    text = page.read_text(encoding="utf-8")
    heading = re.search(
        rf"<h4>\s*{re.escape(section)}\s*<span[^>]*><i>(.*?)</i></span>\s*</h4>", text, re.S
    )
    if heading is None:
        raise ValueError(f"section {section!r} not found")
    # The disease's block runs to the next disease heading.
    following = text.find("<h4>", heading.end())
    block = text[heading.end(): following if following != -1 else len(text)]
    symptoms = re.search(r'<div class="symptoms">(.*?)</div>', block, re.S)
    management = re.search(r'<div class="management">\s*<h5>Management</h5>(.*?)</div>', block, re.S)
    crop = url.split("/topics/")[1].split("/")[0]
    return Factsheet(
        factsheet_id=f"plantvillage-{crop}-" + re.sub(r"[^a-z]+", "-", section.lower()).strip("-"),
        title=f"PlantVillage: {section}",
        country="",
        created="",
        licence=PLANTVILLAGE_LICENCE,
        recognize=_items(symptoms.group(1)) if symptoms else [],
        management=_plain(management.group(1)) if management else "",
        scientific_names=with_genera([n.strip() for n in re.split(r"<br\s*/?>|\n", heading.group(1)) if n.strip()])
        + [section] + re.findall(r"\(([^)]+)\)", section),
    )


# ------------------------------------------------------------------ both sources

def remove_names(text: str, extra: list[str]) -> str:
    """Replace disease and pathogen names with "the disease" (longest names first)."""
    # Bracketed alternative names, e.g. "(the disease is also known black shoulder)", go entirely.
    text = re.sub(r"\s*\([^)]*\b(?:also known|also called|in Swahili)\b[^)]*\)", "", text, flags=re.I)
    for name in sorted(DISEASE_NAMES + [n for n in extra if n], key=len, reverse=True):
        text = re.sub(rf"\b{re.escape(name)}\b", "the disease", text, flags=re.I)
    text = re.sub(r"\bthe disease disease\b", "the disease", text)
    text = re.sub(r"\b(the|The) the disease\b", r"\1 disease", text)
    return text[:1].upper() + text[1:]


def with_genera(scientific_names: list[str]) -> list[str]:
    """Scientific names plus each genus alone, which also names the pathogen ("Alternaria stem canker").

    Only for Latin binomials: a disease title such as "Gray leaf spot" must not turn "gray" into a name.
    """
    genera = [n.split()[0] for n in scientific_names if re.fullmatch(r"[A-Z][a-z]+ [a-z][a-z-]+.*", n)]
    return scientific_names + genera


def read_sources(path: Path) -> list[dict]:
    # utf-8-sig: Excel and PowerShell may add a byte-order mark when saving.
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def _previous_review(out_csv: Path) -> dict[tuple[str, str], tuple[str, str]]:
    """(factsheet_id, sentence) -> (keep, text) from an earlier, hand-reviewed run."""
    if not out_csv.exists():
        return {}
    # errors="replace": a file saved by Excel may hold mis-encoded quotes; only ``keep`` is reused.
    with out_csv.open(newline="", encoding="utf-8-sig", errors="replace") as f:
        return {(r["factsheet_id"], r["sentence"]): (r["keep"].strip().lower(), r["text"]) for r in csv.DictReader(f)}


def build(sources: Path, cache_dir: Path, out_csv: Path, management_dir: Path) -> list[dict]:
    """Download, extract and write one row per sentence; returns a per-source report.

    Re-running keeps the hand review: each row's ``keep`` is carried over from the
    existing file, while the text is always rebuilt from the sources.
    """
    review = _previous_review(out_csv)
    rows, report = [], []
    management_dir.mkdir(parents=True, exist_ok=True)
    for source in read_sources(sources):
        entry = {**source, "status": "ok", "title": "", "sentences": 0}
        try:
            if "plantvillage.psu.edu" in source["url"]:
                sheet = parse_plantvillage(download(source["url"], cache_dir), source["section"], source["url"])
            else:
                sheet = parse_plantwise(download(source["url"], cache_dir))
        except Exception as error:  # blocked or unreadable: skip, never work around
            entry["status"] = f"download/parse failed: {error}"
            report.append(entry)
            continue
        entry["title"] = sheet.title
        if not sheet.licence:
            entry["status"] = "skipped: no CC licence line"
        elif not sheet.recognize:
            entry["status"] = "skipped: no symptom section"
        else:
            for n, sentence in enumerate(sheet.recognize, 1):
                rows.append({
                    "class_name": source["class_name"], "split": source["split"],
                    "factsheet_id": sheet.factsheet_id, "sentence": n,
                    "text": remove_names(sentence, sheet.scientific_names),
                    "keep": review.get((sheet.factsheet_id, str(n)), ("", ""))[0],
                    "source_title": sheet.title, "country": sheet.country, "created": sheet.created,
                    "licence": sheet.licence, "url": source["url"],
                })
            entry["sentences"] = len(sheet.recognize)
            if sheet.management:
                (management_dir / f"{sheet.factsheet_id}.txt").write_text(
                    f"{sheet.title} ({sheet.country or 'no country'}, {sheet.created or 'no date'})\n"
                    f"{source['url']}\n{sheet.licence}\n\n{sheet.management}\n",
                    encoding="utf-8",
                )
        report.append(entry)

    # A class with only two sources trains on one and holds the other out; the held-out
    # source's kept sentences alternate between val and test (neither touches train).
    turn: dict[str, int] = {}
    for row in rows:
        if row["split"] == "heldout" and row["keep"] == "y":
            n = turn[row["factsheet_id"]] = turn.get(row["factsheet_id"], -1) + 1
            row["split"] = "val" if n % 2 == 0 else "test"

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    # utf-8-sig so Excel opens it with the right characters for the next review.
    with out_csv.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=ROW_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return report


if __name__ == "__main__":
    # Run from the repository root: python ml/src/data/symptom_text.py
    folder = Path(__file__).resolve().parents[2] / "data" / "symptoms"
    for entry in build(
        folder / "sources.csv", folder / "cache", folder / "descriptions.csv", folder / "management"
    ):
        print(f"{entry['factsheet_id'][:34]:<35} {entry['class_name'][:30]:<31} {entry['split']:<8} "
              f"{entry['sentences']:>2} sentences  {entry['status']}")
