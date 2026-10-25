"""Policy-answer citation grounding and post-hoc verification (deterministic; no extra LLM call).

Modes (AGENT_CITATION_MODE):
  labels        the model lists the passage labels it relied on (baseline).
  verify        labels + post-hoc verification: a cited passage is kept only if some answer sentence is lexically
                supported by it (relative to the best-supported cited passage); at least one citation is kept.
  spans         rerank-then-quote / citation-span grounding: before answering, the model copies one short VERBATIM
                span per passage it relies on. A span counts only if it is found in a passage; the citation goes to
                the passage that actually contains the span (re-assigned if the model mislabelled it).
  spans_verify  spans, then the post-hoc verification above.
"""
import os
import re
import unicodedata

_STOP = set("""a an the and or of to in on for by with from at as is are was were be been being this that these those it its
into than then there their they them you your yours we our us i me my he she his her not no can could may might will would
shall should must do does did done have has had any all each such which who whom what when where why how also only other
per under over upon about after before within without between""".split())
_TOK = re.compile(r"[a-z0-9]+")


def _env_f(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except ValueError:
        return default


MIN_SUPPORT = _env_f("AGENT_CITE_MIN_SUPPORT", 0.25)   # absolute floor of a kept citation's support
REL_SUPPORT = _env_f("AGENT_CITE_REL_SUPPORT", 0.6)    # kept if support >= REL_SUPPORT * best cited support
SPAN_MIN_COVER = _env_f("AGENT_CITE_SPAN_COVER", 0.85)  # share of a span's tokens that must appear, in order, in the passage


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").lower()
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s).strip()


def _toks(s: str) -> list[str]:
    return _TOK.findall(_norm(s))


def _content(s: str) -> set[str]:
    return {t[:6] for t in _toks(s) if t not in _STOP and (len(t) > 2 or t.isdigit())}


def labels_of(j: dict, mode: str) -> list[str]:
    """Citation labels the model claimed, in order, de-duplicated."""
    if mode in ("spans", "spans_verify"):
        raw = [q.get("label") for q in (j.get("quotes") or []) if isinstance(q, dict)]
        if not raw:
            raw = j.get("citations") or []
    else:
        raw = j.get("citations") or []
    out = []
    for c in raw:
        if isinstance(c, str) and c not in out:
            out.append(c)
    return out


def span_in(span: str, text: str) -> bool:
    """True if `span` (a quote) occurs in `text`: exact after normalisation, or >= SPAN_MIN_COVER of its tokens
    appear in the passage as one contiguous-ish run (tolerates small punctuation/whitespace/ellipsis edits)."""
    sp, tx = _norm(span).strip(" .\"'"), _norm(text)
    if len(sp) < 12:
        return False
    if sp in tx:
        return True
    st, tt = _toks(sp), _toks(tx)
    if len(st) < 4:
        return False
    # longest common subsequence of span tokens within a window of the passage
    best = 0
    pos = {}
    for i, t in enumerate(tt):
        pos.setdefault(t, []).append(i)
    for start in pos.get(st[0], [])[:50] + pos.get(st[1], [])[:50]:
        i, hit = start, 0
        for t in st:
            nxt = next((p for p in pos.get(t, []) if i <= p <= i + 6), None)
            if nxt is not None:
                hit, i = hit + 1, nxt + 1
        best = max(best, hit)
    return best / len(st) >= SPAN_MIN_COVER


def support(answer: str, passage_text: str) -> float:
    """Max over answer sentences of the share of the sentence's content tokens found in the passage."""
    ptoks = _content(passage_text)
    best = 0.0
    for snt in re.split(r"(?<=[.!?;:])\s+|\n+", answer or ""):
        ct = _content(snt)
        if len(ct) < 3:
            continue
        best = max(best, len(ct & ptoks) / len(ct))
    return best


def _latin(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    return bool(letters) and sum(c.isascii() for c in letters) / len(letters) > 0.8


def verify_citations(answer: str, j: dict, passages: list[dict], mode: str) -> tuple[list[str], list[str]]:
    """Return (kept_labels, dropped_labels) for a non-abstaining policy answer."""
    by = {p["label"]: p for p in passages}
    claimed = [c for c in labels_of(j, mode) if c in by]
    cand = list(claimed)
    if mode in ("spans", "spans_verify"):
        grounded = []
        for q in j.get("quotes") or []:
            if not isinstance(q, dict) or not isinstance(q.get("quote"), str):
                continue
            lab = q.get("label")
            order = ([lab] if lab in by else []) + [p["label"] for p in passages if p["label"] != lab]
            hit = next((L for L in order if span_in(q["quote"], by[L]["text"])), None)
            if hit and hit not in grounded:
                grounded.append(hit)
        cand = grounded or claimed  # no span verified: keep what the model claimed (the full-answer guard still runs)
    if mode in ("verify", "spans_verify") and len(cand) > 1 and _latin(answer):
        sc = {L: support(answer, by[L]["text"]) for L in cand}
        top = max(sc.values())
        kept = [L for L in cand if sc[L] >= max(MIN_SUPPORT, REL_SUPPORT * top)] or [max(cand, key=sc.get)]
        cand = kept
    return cand, [c for c in claimed if c not in cand]
