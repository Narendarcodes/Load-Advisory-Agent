"""Automatic validators for the Saral golden datasets (Golden A rag_v2, Golden B agent_v1).

    python scripts/golden/validate_golden.py [--chunks DIR] [--coverage data/evaluation/golden/COVERAGE.md]

Checks:
  1. schema of every RAG item and every conversation (v1 fields kept, v2 fields typed, enums valid)
  2. anchors: chunk id exists in data/corpus_v3/chunk_index.csv with the recorded chunk_sha256; with --chunks (or
     SARAL_CHUNKS_DIR) every quote must also be found verbatim, whitespace-normalised, in its chunk
  3. duplicate and near-duplicate questions (normalised similarity, per language)
  4. questions not copied from chunks (longest shared token run; needs the chunk texts)
  5. coverage matrix: topic x variant x language x behaviour, and scenario x reason category, with minimums
  6. every leak probe turn carries a must_not_include list
  7. no real-looking PII: Aadhaar-like numbers never start with 2-9, PAN only masked, synthetic markers present
Exit code 1 on any error. Warnings are printed but do not fail.
"""
import argparse
import csv
import difflib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLD = ROOT / "data/evaluation/golden"
RAG_FILE = GOLD / "rag_v2/golden.jsonl"
AGENT_FILE = GOLD / "agent_v1/conversations.jsonl"
INDEX_FILE = ROOT / "data/corpus_v3/chunk_index.csv"
DEFAULT_CHUNKS = Path("/workspace/work/loan-qa/work/g1/out")

BEHAVIOURS = {"answer", "answer_note", "clarify", "abstain", "refuse"}
VARIANTS = {"direct", "paraphrase", "multi_hop", "behaviour"}
LANGS = {"en", "hi", "te"}
SCRIPTS = {"latin", "native", "roman"}
DIFFICULTY = {"easy", "medium", "hard"}
CONFLICTS = {"C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"}
V1_FIELDS = ["qid", "category", "topic", "collection", "language", "question", "turns", "expected_behavior", "expected_answer",
             "anchors", "conflict", "note", "origin", "review_status", "gold_docs", "gold_chunks", "conflict_note",
             "calibration", "golden_version"]
V2_FIELDS = ["variant", "script", "behaviour_kind", "must_include", "must_not_include", "difficulty", "source_url", "v1_qid",
             "collections", "split"]
TOPICS_REQUIRED = ["purpose_wedding", "purpose_higher_education", "purpose_home_renovation", "purpose_medical_emergency",
                   "amount", "tenure", "rates", "fees", "eligibility", "documents", "kyc", "kfs_apr_cooling_off",
                   "penal_charges", "prepayment_foreclosure", "sanction", "recovery_conduct", "digital_lending_rights",
                   "grievance", "rejection_reasons", "disbursal_time"]
BEHAVIOUR_KINDS_REQUIRED = ["clarify", "abstain_other_lender", "abstain_internal", "refuse_out_of_scope", "refuse_injection",
                            "refuse_approval_promise", "refuse_tampering"]
TOOLS = {"authorize", "get_application_summary", "get_decision_evidence", "run_what_if", "improvement_plan",
         "search_approved_policy", "create_human_handoff"}
DECISIONS = {"APPROVED", "DECLINED", "MANUAL_REVIEW", "INFO_REQUESTED"}
REASONS = {"employment_stability", "income_verification", "existing_repayments", "credit_history", "recent_applications",
           "could_not_verify_details", "documents", "outside_offer"}
LEAK_PROBES = {"leak_probe", "gaming_probe", "injection", "other_applicant", "what_if"}
SCENARIO_KINDS_REQUIRED = ["approved_prime", "approved_near_prime", "counter_offer", "thin_file", "stale_report"]
INTERNAL_TERMS = re.compile(r"\b(?:ZEN|RAG|OCR|Qdrant|LangGraph)\b|bureau API|rule[ _-]?id", re.I)
AADHAAR_LIKE = re.compile(r"(?<!\d)(\d)\d{3}[ -]?\d{4}[ -]?\d{4}(?!\d)")
PAN_RAW = re.compile(r"\b(?!XXXXX)[A-Z]{5}\d{4}[A-Z]\b")
MASKED_AADHAAR = re.compile(r"^[01]\d{3} XXXX \d{4}$")
MASKED_PAN = re.compile(r"^XXXXX\d{4}X$")
MOBILE_LIKE = re.compile(r"(?<!\d)(?:\+91[ -]?)?[6-9]\d{9}(?!\d)")

norm = lambda s: re.sub(r"\s+", " ", s or "").strip()
TOKEN = re.compile(r"[\w₹.%'-]+", re.U)


def tokens(s):
    return [t.lower().strip(".'") for t in TOKEN.findall(s or "") if t.strip(".'")]


def qnorm(s):
    return " ".join(tokens(s))


def load_jsonl(p):
    return [json.loads(line) for line in Path(p).open(encoding="utf-8") if line.strip()]


def load_index(p=INDEX_FILE):
    with Path(p).open(encoding="utf-8") as f:
        return {r["chunk_id"]: r for r in csv.DictReader(f)}


def load_chunks(d):
    out = {}
    for col in ("saral_nbfc_policy", "rbi_regulatory"):
        f = Path(d) / f"{col}.chunks.jsonl"
        if f.exists():
            for c in load_jsonl(f):
                out[c["chunk_id"]] = c["text"]
    return out


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


# ------------------------------------------------------------------ 1. schema
def check_rag_schema(items, rep):
    for g in items:
        q = g.get("qid", "?")
        for f in V1_FIELDS + V2_FIELDS:
            if f not in g:
                rep.err(q, f"missing field {f}")
        if g.get("expected_behavior") not in BEHAVIOURS:
            rep.err(q, f"bad expected_behavior {g.get('expected_behavior')}")
        if g.get("variant") not in VARIANTS:
            rep.err(q, f"bad variant {g.get('variant')}")
        if g.get("language") not in LANGS or g.get("script") not in SCRIPTS:
            rep.err(q, "bad language/script")
        if (g.get("language") == "en") != (g.get("script") == "latin"):
            rep.err(q, "script must be latin for en and native/roman for hi/te")
        if g.get("difficulty") not in DIFFICULTY:
            rep.err(q, "bad difficulty")
        if g.get("origin") != "frontier-authored" or g.get("review_status") != "pending_human":
            rep.err(q, "origin/review_status must be frontier-authored/pending_human")
        if not norm(g.get("question")) or not norm(g.get("expected_answer")):
            rep.err(q, "empty question or expected_answer")
        if not g.get("turns") or g["turns"][-1].get("role") != "user":
            rep.err(q, "turns must end with a user turn")
        beh = g.get("expected_behavior")
        if beh in ("answer", "answer_note"):
            if not g.get("anchors"):
                rep.err(q, "answerable item without anchors")
            if not g.get("must_include"):
                rep.err(q, "answerable item without must_include")
            if not g.get("must_not_include"):
                rep.err(q, "answerable item without must_not_include")
        if beh == "answer_note" and g.get("conflict") not in CONFLICTS:
            rep.err(q, "answer_note needs a recorded conflict id")
        if g.get("conflict") is not None and g["conflict"] not in CONFLICTS:
            rep.err(q, f"unknown conflict {g['conflict']}")
        if g.get("variant") == "multi_hop" and len(set(g.get("gold_chunks") or [])) < 2:
            rep.err(q, "multi_hop item needs anchors in at least two chunks")
        if g.get("variant") == "behaviour" and not g.get("behaviour_kind"):
            rep.err(q, "behaviour item needs behaviour_kind")
        if beh in ("abstain", "refuse") and not g.get("must_not_include"):
            rep.err(q, "abstain/refuse item needs must_not_include")
        if g.get("split") not in (None, "dev", "heldout"):
            rep.err(q, "bad split")
        if INTERNAL_TERMS.search(g.get("expected_answer", "")) and beh not in ("refuse", "abstain"):
            rep.err(q, "expected_answer names an internal system")
        for a in g.get("anchors") or []:
            for f in ("doc_id", "chunk_id", "quote", "collection", "chunk_sha256"):
                if not a.get(f):
                    rep.err(q, f"anchor missing {f}")
            if a.get("chunk_id", "").split("#")[0] != a.get("doc_id"):
                rep.err(q, f"anchor doc_id/chunk_id mismatch {a.get('chunk_id')}")


def check_agent_schema(convs, rep, rag_qids=frozenset()):
    for c in convs:
        cid = c.get("conv_id", "?")
        for f in ("conv_id", "scenario_id", "scenario", "language", "script", "chatbot_role", "scenario_text", "expected_outcome",
                  "applicant", "stored_decision", "expected_reason_category", "expected_decision_source", "turns", "metrics",
                  "global_must_not_include", "global_must_not_include_patterns", "origin", "review_status", "split"):
            if f not in c:
                rep.err(cid, f"missing field {f}")
        if c.get("expected_decision_source") != "scenario_spec_pending_zen_v2":
            rep.err(cid, "expected_decision_source must be scenario_spec_pending_zen_v2")
        sd = c.get("stored_decision") or {}
        if sd.get("decision") not in DECISIONS:
            rep.err(cid, f"bad decision {sd.get('decision')}")
        if not sd.get("grader_only"):
            rep.err(cid, "stored_decision must be marked grader_only")
        rc = c.get("expected_reason_category")
        if rc is not None and rc not in REASONS:
            rep.err(cid, f"bad reason category {rc}")
        if sd.get("decision") == "DECLINED" and rc is None:
            rep.err(cid, "DECLINED needs a reason category")
        if c.get("language") not in LANGS:
            rep.err(cid, "bad language")
        if c.get("origin") != "frontier-authored" or c.get("review_status") != "pending_human":
            rep.err(cid, "origin/review_status")
        names = [m.get("metric") for m in c.get("metrics", [])]
        for m in ("ConversationalGEval", "RoleAdherence", "ConversationCompleteness", "TurnRelevancy", "ToolCorrectness"):
            if m not in names:
                rep.err(cid, f"metric {m} missing")
        if not c.get("turns"):
            rep.err(cid, "no turns")
        for t in c.get("turns", []):
            w = f"{cid}#t{t.get('turn')}"
            if not norm(t.get("user")) or not norm(t.get("expected_behaviour")):
                rep.err(w, "empty user text or expected_behaviour")
            tl = t.get("expected_tool_calls")
            if not tl or not set(tl) <= TOOLS:
                rep.err(w, f"bad expected_tool_calls {tl}")
            elif tl[0] != "authorize":
                rep.err(w, "authorize must be the first tool call (authenticate node)")
            if t.get("probe") == "policy" and "search_approved_policy" not in (tl or []):
                rep.err(w, "policy turn must call search_approved_policy")
            if t.get("probe") == "policy" and not t.get("policy_anchors"):
                rep.err(w, "policy turn must carry policy_anchors from Golden A")
            for q in t.get("policy_ref_qids", []):
                if rag_qids and q not in rag_qids:
                    rep.err(w, f"policy_ref_qid {q} not in Golden A")
            ex = t.get("global_pattern_exempt") or []
            if ex:
                # owner decision 2026-11-03: a public figure may be cited on a policy turn, but the turn must keep link probes
                if not set(ex) <= set(c.get("global_must_not_include_patterns", [])):
                    rep.err(w, "global_pattern_exempt names a pattern that is not a conversation-level pattern")
                if t.get("probe") != "policy" or not t.get("must_not_include_patterns"):
                    rep.err(w, "global_pattern_exempt only on a policy turn that carries its own link-probe patterns")
            if t.get("citation_required") is False and t.get("answer_source") != "product_config":
                rep.err(w, "citation_required false is only for answers from the product config")
            if t.get("answer_source") == "product_config" and "search_approved_policy" in (tl or []):
                rep.err(w, "product_config answers must not route to policy retrieval")
            for p in t.get("must_not_include_patterns", []) + c.get("global_must_not_include_patterns", []):
                try:
                    re.compile(p)
                except re.error as e:
                    rep.err(w, f"bad regex {p!r}: {e}")


# ------------------------------------------------------------------ 2. anchors
def check_anchors(items, index, chunks, rep):
    n = 0
    for g in items:
        for a in g.get("anchors") or []:
            row = index.get(a.get("chunk_id"))
            if row is None:
                rep.err(g["qid"], f"anchor chunk {a.get('chunk_id')} not in chunk_index.csv")
                continue
            if row["chunk_sha256"] != a.get("chunk_sha256"):
                rep.err(g["qid"], f"chunk_sha256 drift for {a['chunk_id']}")
            if chunks:
                if a["chunk_id"] not in chunks:
                    rep.err(g["qid"], f"chunk {a['chunk_id']} not in chunk texts")
                elif norm(a["quote"]) not in norm(chunks[a["chunk_id"]]):
                    rep.err(g["qid"], f"quote not verbatim in {a['chunk_id']}: {a['quote'][:60]!r}")
                else:
                    n += 1
    return n


# ------------------------------------------------------------------ 3. duplicates
def check_duplicates(items, rep, dup=0.92, near=0.80):
    by_lang = defaultdict(list)
    for g in items:
        by_lang[g["language"]].append((g["qid"], qnorm(g["question"]), tuple(t["content"] for t in g["turns"][:-1])))
    pairs = []
    for lang, rows in by_lang.items():
        for i in range(len(rows)):
            for j in range(i + 1, len(rows)):
                a, b = rows[i], rows[j]
                r = difflib.SequenceMatcher(None, a[1], b[1]).ratio()
                if r >= near:
                    pairs.append((a[0], b[0], round(r, 3)))
                    same_context = a[2] == b[2]
                    if r >= dup and same_context:
                        rep.err(f"{a[0]}~{b[0]}", f"duplicate question (similarity {r:.2f})")
                    else:
                        rep.warn(f"{a[0]}~{b[0]}", f"near-duplicate question (similarity {r:.2f}); check the intent differs")
    return pairs


# ------------------------------------------------------------------ 4. copied from chunks
def ngram_set(chunks, n):
    s = set()
    for text in chunks.values():
        tk = tokens(text)
        s.update(tuple(tk[i:i + n]) for i in range(len(tk) - n + 1))
    return s


def longest_shared_run(q_tokens, sets_by_n):
    best = 0
    for n in sorted(sets_by_n):
        grams = sets_by_n[n]
        if any(tuple(q_tokens[i:i + n]) in grams for i in range(len(q_tokens) - n + 1)):
            best = n
    return best


def check_copy(items, chunks, rep, fail_at=8, warn_at=6):
    if not chunks:
        rep.warn("copy-check", "chunk texts not available; question-copy check skipped")
        return {}
    sets_by_n = {n: ngram_set(chunks, n) for n in range(warn_at, 16)}
    runs = {}
    for g in items:
        for t in g["turns"]:
            if t["role"] != "user":
                continue
            r = longest_shared_run(tokens(t["content"]), sets_by_n)
            runs[g["qid"]] = max(runs.get(g["qid"], 0), r)
            if r >= fail_at:
                rep.err(g["qid"], f"question shares a {r}-token run with a chunk (copied?)")
            elif r >= warn_at:
                rep.warn(g["qid"], f"question shares a {r}-token run with a chunk")
    return runs


# ------------------------------------------------------------------ 5. coverage
def coverage(items, convs, rep):
    topic_variant = defaultdict(Counter)
    topic_lang = defaultdict(Counter)
    for g in items:
        topic_variant[g["topic"]][g["variant"]] += 1
        topic_lang[g["topic"]][g["language"]] += 1
    for t in TOPICS_REQUIRED:
        tv = topic_variant.get(t, Counter())
        if sum(tv.values()) < 3:
            rep.err(f"coverage:{t}", f"only {sum(tv.values())} items (need >= 3)")
        for v in ("direct", "paraphrase", "multi_hop"):
            if tv[v] < 1:
                rep.err(f"coverage:{t}", f"no {v} item")
    kinds = Counter(g["behaviour_kind"] for g in items if g["behaviour_kind"])
    for k in BEHAVIOUR_KINDS_REQUIRED:
        if kinds[k] < 1:
            rep.err("coverage:behaviour", f"no {k} item")
    if not any(g["expected_behavior"] == "answer_note" for g in items):
        rep.err("coverage:behaviour", "no answer_note (conflict) item")
    lang_script = Counter((g["language"], g["script"]) for g in items if g["language"] != "en")
    if sum(lang_script.values()) < 20:
        rep.err("coverage:language", f"only {sum(lang_script.values())} Hindi/Telugu items (need >= 20)")
    for k in [("hi", "native"), ("hi", "roman"), ("te", "native"), ("te", "roman")]:
        if lang_script[k] < 1:
            rep.err("coverage:language", f"no {k} item")
    conflicts = Counter(g["conflict"] for g in items if g["conflict"])
    scen_reason = defaultdict(Counter)
    decl_reasons = set()
    for c in convs:
        rc = c["expected_reason_category"] or "-"
        scen_reason[c["scenario"]][rc] += 1
        if c["stored_decision"]["decision"] == "DECLINED":
            decl_reasons.add(rc)
    for r in REASONS:
        if r not in decl_reasons:
            rep.err("coverage:agent", f"no DECLINED conversation with reason {r}")
    decisions = Counter(c["stored_decision"]["decision"] for c in convs)
    for d in DECISIONS:
        if decisions[d] < 1:
            rep.err("coverage:agent", f"no {d} conversation")
    for k in SCENARIO_KINDS_REQUIRED:
        if not any(k in c["scenario"] for c in convs):
            rep.err("coverage:agent", f"no {k} scenario")
    probes = Counter(t["probe"] for c in convs for t in c["turns"])
    for p in ("leak_probe", "improve", "clarify", "policy", "other_applicant", "injection", "guarantee", "edit_record",
              "bureau_request", "distress"):
        if probes[p] < 1:
            rep.err("coverage:agent", f"no {p} turn")
    clang = Counter(c["language"] for c in convs)
    for lang in ("hi", "te"):
        if clang[lang] < 1:
            rep.err("coverage:agent", f"no {lang} conversation")
    return {"topic_variant": topic_variant, "topic_lang": topic_lang, "kinds": kinds, "lang_script": lang_script,
            "conflicts": conflicts, "scen_reason": scen_reason, "decisions": decisions, "probes": probes, "clang": clang}


# ------------------------------------------------------------------ 6. leak probes
def check_leak_probes(convs, rep):
    n = 0
    for c in convs:
        for t in c["turns"]:
            if t.get("probe") in LEAK_PROBES or t.get("leak_probe"):
                n += 1
                if not t.get("must_not_include"):
                    rep.err(f"{c['conv_id']}#t{t['turn']}", "leak probe without must_not_include")
    return n


def check_self_consistency(convs, rep):
    """A turn's must_include checklist must not itself trip that turn's or the conversation's must_not patterns."""
    for c in convs:
        for t in c["turns"]:
            ex = set(t.get("global_pattern_exempt") or [])
            pats = t.get("must_not_include_patterns", []) + [p for p in c.get("global_must_not_include_patterns", []) if p not in ex]
            for inc in t.get("must_include", []):
                for p in pats:
                    if re.search(p, inc):
                        rep.err(f"{c['conv_id']}#t{t['turn']}", f"must_include {inc!r} matches must_not pattern {p!r}")


# ------------------------------------------------------------------ 7. PII
def _strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            if k != "chunk_sha256":
                yield from _strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from _strings(v)


def check_pii(items, convs, rep):
    for c in convs:
        a = c.get("applicant") or {}
        cid = c["conv_id"]
        if not str(a.get("applicant_id", "")).startswith("SYN-APP-") or a.get("synthetic") is not True:
            rep.err(cid, "applicant must have a SYN-APP- id and synthetic: true")
        if not MASKED_AADHAAR.match(a.get("aadhaar_masked", "")):
            rep.err(cid, "aadhaar_masked must look like '0XXX XXXX 1234' and start with 0 or 1")
        if not MASKED_PAN.match(a.get("pan_masked", "")):
            rep.err(cid, "pan_masked must be masked")
        for s in _strings(c):
            for m in AADHAAR_LIKE.finditer(s):
                if m.group(1) not in "01":
                    rep.err(cid, f"Aadhaar-like number starting with {m.group(1)}: {m.group(0)}")
            if PAN_RAW.search(s):
                rep.err(cid, f"unmasked PAN-like value {PAN_RAW.search(s).group(0)}")
            if MOBILE_LIKE.search(s):
                rep.err(cid, f"mobile-number-like value {MOBILE_LIKE.search(s).group(0)}")
    for g in items:
        for s in _strings({k: v for k, v in g.items() if k not in ("anchors",)}):
            for m in AADHAAR_LIKE.finditer(s):
                if m.group(1) not in "01":
                    rep.err(g["qid"], f"Aadhaar-like number starting with {m.group(1)}")
            if PAN_RAW.search(s):
                rep.err(g["qid"], f"unmasked PAN-like value {PAN_RAW.search(s).group(0)}")


def check_freeze(items, convs, rep, manifest_path=GOLD / "MANIFEST.json"):
    """Split ratio, calibration count and (if frozen) the SHA-256 manifest."""
    import hashlib
    for name, rows in (("golden_a", items), ("golden_b", convs)):
        splits = Counter(r.get("split") for r in rows)
        if None in splits:
            rep.warn(name, "not frozen yet (split missing); run scripts/golden/freeze_golden.py")
            return
        share = splits["heldout"] / max(1, len(rows))
        if not 0.15 <= share <= 0.25:
            rep.err(name, f"held-out share {share:.0%} outside 15-25%")
        if any(r.get("calibration") and r.get("split") == "heldout" for r in rows):
            rep.err(name, "a calibration item is in the held-out split")
    ncal = sum(1 for r in items if r.get("calibration")) + sum(1 for c in convs if c.get("calibration"))
    if ncal != 30:
        rep.err("calibration", f"{ncal} calibration items (expected 30)")
    mp = Path(manifest_path)
    if not mp.exists():
        rep.warn("manifest", "MANIFEST.json missing")
        return
    man = json.loads(mp.read_text(encoding="utf-8"))
    for f in man.get("files", []):
        fp = ROOT / f["path"]
        if not fp.exists() or hashlib.sha256(fp.read_text(encoding="utf-8").encode("utf-8")).hexdigest() != f["sha256"]:
            rep.err("manifest", f"sha256 mismatch for {f['path']} (data changed after freeze; re-run freeze_golden.py)")


# ------------------------------------------------------------------ COVERAGE.md
def write_coverage(path, items, convs, cov, rep, anchors_verified, runs):
    L = ["# Saral golden datasets: coverage (generated by scripts/golden/validate_golden.py)", ""]
    L.append(f"- Golden A (rag_v2): **{len(items)}** items; Golden B (agent_v1): **{len(convs)}** conversations, "
             f"**{sum(len(c['turns']) for c in convs)}** turns, **{len({c['scenario_id'] for c in convs})}** scenarios.")
    L.append(f"- Anchors verified verbatim against chunk texts: **{anchors_verified}** "
             f"({'full check' if anchors_verified else 'ids and hashes only; chunk texts not available'}).")
    L.append(f"- Validator result: **{len(rep.errors)} errors, {len(rep.warnings)} warnings**.")
    hold = Counter(g.get("split") for g in items)
    holdc = Counter(c.get("split") for c in convs)
    L.append(f"- Split: Golden A {dict(hold)}; Golden B {dict(holdc)}.")
    L += ["", "## Golden A: topic x variant", "", "| topic | direct | paraphrase | multi_hop | total | en | hi | te |", "|---|---:|---:|---:|---:|---:|---:|---:|"]
    for t in TOPICS_REQUIRED + sorted(set(cov["topic_variant"]) - set(TOPICS_REQUIRED)):
        tv, tl = cov["topic_variant"].get(t, Counter()), cov["topic_lang"].get(t, Counter())
        L.append(f"| {t} | {tv['direct']} | {tv['paraphrase']} | {tv['multi_hop']} | {sum(tv.values())} | {tl['en']} | {tl['hi']} | {tl['te']} |")
    L += ["", "## Golden A: behaviour", "", "| expected_behavior | count |", "|---|---:|"]
    for b, n in sorted(Counter(g["expected_behavior"] for g in items).items()):
        L.append(f"| {b} | {n} |")
    L += ["", "| behaviour_kind | count |", "|---|---:|"]
    for k, n in sorted(cov["kinds"].items()):
        L.append(f"| {k} | {n} |")
    L += ["", "## Golden A: language x script", "", "| language | script | count |", "|---|---|---:|"]
    for (lang, sc), n in sorted(Counter((g["language"], g["script"]) for g in items).items()):
        L.append(f"| {lang} | {sc} | {n} |")
    L += ["", "## Golden A: conflicts and difficulty", "", "| conflict | items |", "|---|---:|"]
    for k, n in sorted(cov["conflicts"].items()):
        L.append(f"| {k} | {n} |")
    L += ["", "| difficulty | count |", "|---|---:|"]
    for k, n in sorted(Counter(g["difficulty"] for g in items).items()):
        L.append(f"| {k} | {n} |")
    if runs:
        L += ["", f"Longest token run shared between any question and any chunk: {max(runs.values())} tokens "
              f"(fail at 8, warn at 6); items at >= 6: {sum(1 for r in runs.values() if r >= 6)}."]
    L += ["", "## Golden B: scenario x reason category", "", "| scenario | reason category | conversations |", "|---|---|---:|"]
    for s in sorted(cov["scen_reason"]):
        for r, n in sorted(cov["scen_reason"][s].items()):
            L.append(f"| {s} | {r} | {n} |")
    L += ["", "| decision | conversations |", "|---|---:|"]
    for k, n in sorted(cov["decisions"].items()):
        L.append(f"| {k} | {n} |")
    L += ["", "| probe | turns |", "|---|---:|"]
    for k, n in sorted(cov["probes"].items()):
        L.append(f"| {k} | {n} |")
    L += ["", "| language | conversations |", "|---|---:|"]
    for k, n in sorted(cov["clang"].items()):
        L.append(f"| {k} | {n} |")
    if rep.warnings:
        L += ["", "## Warnings", ""] + [f"- {w}" for w in rep.warnings]
    if rep.errors:
        L += ["", "## Errors", ""] + [f"- {e}" for e in rep.errors]
    Path(path).write_text("\n".join(L) + "\n", encoding="utf-8")


def validate(rag_file=RAG_FILE, agent_file=AGENT_FILE, chunks_dir=None, coverage_path=None, index_file=INDEX_FILE):
    rep = Report()
    items, convs = load_jsonl(rag_file), load_jsonl(agent_file)
    index = load_index(index_file)
    chunks = load_chunks(chunks_dir) if chunks_dir and Path(chunks_dir).exists() else {}
    ids = Counter(g["qid"] for g in items) + Counter(c["conv_id"] for c in convs)
    for k, n in ids.items():
        if n > 1:
            rep.err(k, "duplicate id")
    check_rag_schema(items, rep)
    check_agent_schema(convs, rep, frozenset(g["qid"] for g in items))
    verified = check_anchors(items, index, chunks, rep)
    check_duplicates(items, rep)
    runs = check_copy(items, chunks, rep)
    cov = coverage(items, convs, rep)
    check_leak_probes(convs, rep)
    check_self_consistency(convs, rep)
    check_pii(items, convs, rep)
    if Path(rag_file) == RAG_FILE:
        check_freeze(items, convs, rep)
    if coverage_path:
        write_coverage(coverage_path, items, convs, cov, rep, verified, runs)
    return rep, {"items": len(items), "conversations": len(convs), "anchors_verified": verified}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunks", default=os.environ.get("SARAL_CHUNKS_DIR") or (str(DEFAULT_CHUNKS) if DEFAULT_CHUNKS.exists() else None))
    ap.add_argument("--coverage", default=str(GOLD / "COVERAGE.md"))
    a = ap.parse_args(argv)
    rep, info = validate(chunks_dir=a.chunks, coverage_path=a.coverage)
    for w in rep.warnings:
        print("WARN ", w)
    for e in rep.errors:
        print("ERROR", e)
    print(f"{info['items']} RAG items, {info['conversations']} conversations, {info['anchors_verified']} anchors verified verbatim; "
          f"{len(rep.errors)} errors, {len(rep.warnings)} warnings")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
