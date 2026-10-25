"""Policy-answer citation grounding and post-hoc verification (deterministic; no extra LLM call).

Modes (AGENT_CITATION_MODE):
  labels        the model lists the passage labels it relied on (baseline).
  verify        labels + post-hoc verification: a cited passage is kept only if some answer sentence is lexically
                supported by it (relative to the best-supported cited passage); at least one citation is kept.
  spans         rerank-then-quote / citation-span grounding: before answering, the model copies one short VERBATIM
                span per passage it relies on. A span counts only if it is found in a passage; the citation goes to
                the passage that actually contains the span (re-assigned if the model mislabelled it).
  spans_verify  spans, then the post-hoc verification above.
  primary_source  labels, then keep the cited passages from ONE source document: the cited document that best supports
                the answer (support, then currency, then retrieval rank as tie-breaks). Cross-document corroborations
                (e.g. a lender code that restates an RBI direction) are dropped, so a reader gets one primary source to
                check. A second document is kept when the cited sources conflict and the answer does not acknowledge it,
                when the answer contrasts versions, or when it uniquely supports part of an answer sentence the primary
                only partly covers. No extra LLM call. Trade-off: a pure restatement still collapses to one source.
  one_source    the composer is asked to answer from ONE source document (prompts.ONE_SOURCE_RULE), then primary_source.
  one_source_soft  the ONE_SOURCE_RULE prompt only; the model's labels are kept as given.
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
_SENT_SPLIT = re.compile(r"(?<=[.!?;:])\s+|\n+")
_NUM = re.compile(r"(?<![\w.])(\d[\d,]*(?:\.\d+)?)")
_NEGATED = re.compile(r"\b(not|no|never|cannot|can't|isn't|aren't|doesn't|don't|won't)\b", re.I)
_CONFLICT_CUE = re.compile(
    r"\b(conflict(?:s|ing)?|contradict(?:s|ing|ory)?|inconsistent|discrepanc(?:y|ies)|whereas|however)\b"
    r"|\bin contrast\b|\bon the other hand\b"
    r"|\b(sources?|documents?|polic(?:y|ies)|versions?|figures?|numbers?)\b[^.]{0,40}"
    r"\b(?:disagree|differ|conflict|contradict|inconsistent|vary|varies)\b", re.I)
_VERSION_CONTRAST = re.compile(r"\b(previously|earlier|older|historical|superseded|used to|at the time|version|v\d)\b", re.I)


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


def _sentence_support(sentence: str, text: str) -> float:
    ct = _content(sentence)
    if len(ct) < 3:
        return 0.0
    return len(ct & _content(text)) / len(ct)


def _nums(text: str) -> set[str]:
    return {m.group(1).replace(",", "") for m in _NUM.finditer(text or "")}


def _negated(text: str) -> bool:
    return bool(_NEGATED.search(text or ""))


def _conflicting_texts(a: str, b: str) -> bool:
    """Near-identical sentences (>= 60% shared content) that differ in a number or in negation polarity.
    This catches the dangerous 'same rule, different value' case without treating different products/segments as
    conflicts (their sentences share too few content tokens)."""
    for sa in _SENT_SPLIT.split(a or ""):
        ca = _content(sa)
        if len(ca) < 3:
            continue
        for sb in _SENT_SPLIT.split(b or ""):
            cb = _content(sb)
            if len(cb) < 3:
                continue
            union = ca | cb
            if not union or len(ca & cb) / len(union) < 0.6:
                continue
            na, nb = _nums(sa), _nums(sb)
            if na and nb and na != nb:
                return True
            if _negated(sa) != _negated(sb):
                return True
    return False


def _same_scope(a: dict, b: dict) -> bool:
    """Same-source scope: the profile relationship label distinguishes the profile's own lender from another
    lender's document. Regulator and own-lender texts (both without a distinct relationship) are comparable."""
    return (a["citation"].get("relationship") or "") == (b["citation"].get("relationship") or "")


def _historical(p: dict) -> bool:
    return p["citation"].get("approval_status") == "approved_historical"


def _source_conflict(labels: list[str], by: dict, answer: str) -> bool:
    """True when two cited passages from different documents are in the same scope and contradict each other.
    A historical/current pair is only a contradiction when the answer contrasts the versions; otherwise the
    current version is simply the applicable one."""
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            a, b = by[labels[i]], by[labels[j]]
            if a["citation"]["document_id"] == b["citation"]["document_id"] or not _same_scope(a, b):
                continue
            if _historical(a) != _historical(b) and not _VERSION_CONTRAST.search(answer or ""):
                continue
            if _conflicting_texts(a["text"], b["text"]):
                return True
    return False


def _one_primary(cand: list[str], answer: str, by: dict, passages: list[dict]) -> list[str]:
    """Primary-source selection: choose the cited document that best supports the answer (support, then currency,
    then retrieval rank as tie-breaks), but never hide a conflict the answer acknowledges or the layer can detect,
    and keep another document when it uniquely supports part of a sentence the primary only partly covers."""
    if not cand or _CONFLICT_CUE.search(answer or "") or _source_conflict(cand, by, answer):
        return list(cand)
    if _VERSION_CONTRAST.search(answer or "") and len({_historical(by[L]) for L in cand}) > 1:
        return list(cand)
    rank = {p["label"]: i for i, p in enumerate(passages)}
    docs: list[str] = []
    for L in cand:
        d = by[L]["citation"]["document_id"]
        if d not in docs:
            docs.append(d)

    def doc_key(doc: str):
        ls = [L for L in cand if by[L]["citation"]["document_id"] == doc]
        score = max(support(answer, by[L]["text"]) for L in ls)
        hist = all(_historical(by[L]) for L in ls)
        return (round(score, 2), 0 if hist else 1, -min(rank.get(L, len(passages)) for L in ls))

    primary = max(docs, key=doc_key)
    keep = [L for L in cand if by[L]["citation"]["document_id"] == primary]
    sents = [s for s in _SENT_SPLIT.split(answer or "") if len(_content(s)) >= 3]
    if sents:
        primary_toks = set().union(*(_content(by[L]["text"]) for L in keep))
        for L in cand:
            if L in keep:
                continue
            ltoks = _content(by[L]["text"])
            for s in sents:
                stoks = _content(s)
                covered = len(stoks & primary_toks) / len(stoks)
                if covered >= REL_SUPPORT:
                    continue
                if len(stoks & ltoks) / len(stoks) >= MIN_SUPPORT and (stoks & ltoks) - primary_toks:
                    keep.append(L)
                    break
    return [L for L in cand if L in keep]


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
    if mode in ("primary_source", "one_source") and len(cand) > 1:
        cand = _one_primary(cand, answer, by, passages)
    if mode in ("verify", "spans_verify") and len(cand) > 1 and _latin(answer):
        sc = {L: support(answer, by[L]["text"]) for L in cand}
        top = max(sc.values())
        kept = [L for L in cand if sc[L] >= max(MIN_SUPPORT, REL_SUPPORT * top)] or [max(cand, key=sc.get)]
        cand = kept
    return cand, [c for c in claimed if c not in cand]


def select_verified(j: dict, cited: list[str], passages: list[dict], kind: str = "labels", policy: str = "prune") -> list[str]:
    """Turn a citation-verifier's output into the final citation labels.

    kind    labels  j = {"supporting": ["P1", ...]}
            quotes  j = {"supporting": [{"label": "P1", "quote": "<verbatim>"}, ...]}; a quote counts only if it is found
                    (span_in) in a passage, and it is credited to the passage that contains it (re-assigned if mislabelled).
    policy  prune   keep only labels the answer cited AND the verifier confirmed (never adds a passage)
            replace use the verifier's confirmed labels, even ones the answer did not cite
    Falls back to the answer's own labels when the verifier confirms nothing usable."""
    by = {p["label"]: p for p in passages}
    got: list[str] = []
    for item in (j or {}).get("supporting") or []:
        if kind == "quotes":
            if not isinstance(item, dict) or not isinstance(item.get("quote"), str):
                continue
            lab = item.get("label")
            order = ([lab] if lab in by else []) + [L for L in by if L != lab]
            hit = next((L for L in order if span_in(item["quote"], by[L]["text"])), None)
        else:
            hit = item if isinstance(item, str) and item in by else None
        if hit and hit not in got:
            got.append(hit)
    cited = [c for c in cited if c in by]
    if policy == "replace":
        return got or cited
    return [c for c in cited if c in got] or cited
