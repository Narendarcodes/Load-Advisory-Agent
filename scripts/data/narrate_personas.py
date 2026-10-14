"""Add applicant narratives + questions to the synthetic personas with gpt-oss-120b.

Runs ON THE DROPLET against the shared vLLM server (OpenAI API, model "llm"):
    LLM_BASE=http://127.0.0.1:8001/v1 python scripts/data/narrate_personas.py --workers 128

Input : data/synthetic/personas/personas_v1.jsonl
Output: data/synthetic/personas/personas_v1_narrated.jsonl (+ narration_report.json)

The LLM only writes the applicant's own voice. It is given the persona facts and the
recorded (synthetic) outcome, and is told NOT to state lender reasons, thresholds or
promises. Each output is checked deterministically (numbers must match persona facts;
no policy thresholds; no approval guarantees) and retried once on failure; residual
failures are kept but flagged `qc.passed=false`.
"""
import argparse
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
IN = ROOT / "data" / "synthetic" / "personas" / "personas_v1.jsonl"
OUT = ROOT / "data" / "synthetic" / "personas" / "personas_v1_narrated.jsonl"
BASE = os.environ.get("LLM_BASE", "http://127.0.0.1:8001/v1")
MODEL = os.environ.get("LLM_MODEL", "llm")

STYLE = {
    "low": "very simple everyday words, short sentences, unsure about financial terms (may confuse EMI, interest, CIBIL), may mix in a few romanised words from their language",
    "medium": "plain conversational language, knows basic terms like EMI and CIBIL score but not FOIR",
    "high": "confident, uses terms like FOIR, credit utilisation, tenure correctly",
}
SYSTEM = (
    "You write realistic but entirely fictional Indian personal-loan applicant voices for a test dataset. "
    "Write ONLY what the applicant would say. Never state the lender's internal reasons, rule thresholds, "
    "cut-offs or policies, never claim to know why they were rejected, never promise or predict approval. "
    "Use only the numbers given; do not invent new amounts. Output strict JSON."
)


def prompt(p):
    facts = {k: p[k] for k in ("employment_type", "city_tier", "age_band", "preferred_language", "loan_purpose",
                               "monthly_income", "monthly_obligations", "credit_score", "employment_months",
                               "loan_amount", "loan_tenure_months")}
    outcome = {"APPROVED": "their application was approved", "REJECTED": "their application was rejected",
               "ERROR": "the lender could not process the application because some information was missing or invalid"}[p["label"]["decision"]]
    return (
        f"Applicant facts (INR, monthly): {json.dumps(facts, ensure_ascii=False)}\n"
        f"Outcome the applicant was told: {outcome}.\n"
        f"Loan literacy: {p['loan_literacy']} -> style: {STYLE[p['loan_literacy']]}.\n"
        "Return JSON with keys: \"narrative\" (60-120 words, first person, their situation and why they need the loan; "
        "money amounts optional but if used must be exactly the facts above), \"questions\" (list of 3 questions they "
        "would ask a loan advisor next, at least one about what they can do before reapplying), "
        "\"misconception\" (one plausible misunderstanding they hold about loans, or null)."
    )


THRESH = re.compile(r"\b(700|45\s?%|0\.45|25,?000 (?:is|minimum)|12 months minimum)\b", re.I)
GUAR = re.compile(r"\b(guarantee[ds]?|will definitely (?:get|be) approved|sure to be approved)\b", re.I)


def qc(p, out):
    issues = []
    if not isinstance(out.get("narrative"), str) or not isinstance(out.get("questions"), list) or len(out["questions"]) < 2:
        return ["schema"]
    text = out["narrative"] + " " + " ".join(map(str, out["questions"]))
    allowed = [p[k] for k in ("monthly_income", "monthly_obligations", "loan_amount", "credit_score") if isinstance(p[k], (int, float))]
    for m in re.findall(r"(?:₹|rs\.?|inr)?\s?(\d[\d,]{3,})", text, re.I):
        v = float(m.replace(",", ""))
        if v >= 1000 and not any(abs(v - a) <= 0.02 * max(a, 1) for a in allowed):
            issues.append(f"unsupported_number:{m}")
    if p["credit_score"] != 700 and THRESH.search(out["narrative"]):
        issues.append("mentions_policy_threshold")
    if GUAR.search(text):
        issues.append("approval_guarantee_language")
    return issues


def _post(body, max_wait=900):
    """POST with exponential backoff on connection errors / 5xx (e.g. the shared vLLM server
    restarting). These waits are infrastructure, not results: they never count as an attempt."""
    delay, waited = 2, 0
    while True:
        try:
            r = requests.post(f"{BASE}/chat/completions", timeout=180, json=body)
            if r.status_code < 500:
                return r
        except requests.ConnectionError:
            pass
        if waited >= max_wait:
            raise TimeoutError("LLM server unavailable")
        time.sleep(delay); waited += delay; delay = min(delay * 2, 60)


def call(p):
    for attempt in range(2):
        t = time.time()
        try:
            r = _post({
                "model": MODEL, "reasoning_effort": "low", "max_tokens": 1200, "temperature": 0.9,
                "response_format": {"type": "json_object"},
                "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt(p)}]})
            r.raise_for_status()
            out = json.loads(r.json()["choices"][0]["message"]["content"])
            issues = qc(p, out)
        except Exception as e:  # network / JSON errors count as a failed attempt
            out, issues = {}, [f"error:{type(e).__name__}"]
        if not issues:
            break
    return {**p, "narration": out, "qc": {"passed": not issues, "issues": issues, "attempts": attempt + 1,
                                          "latency_s": round(time.time() - t, 2), "model": "gpt-oss-120b (vLLM, served as 'llm')"}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=128)  # vLLM max-num-seqs 256
    ap.add_argument("--limit", type=int)
    a = ap.parse_args()
    rows = [json.loads(l) for l in IN.open()][: a.limit]
    t0 = time.time()
    with ThreadPoolExecutor(a.workers) as ex, OUT.open("w") as f:
        done = []
        for i, r in enumerate(ex.map(call, rows)):
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
            done.append(r)
            if i % 200 == 0:
                print(i, round(time.time() - t0), flush=True)
    rep = {"rows": len(done), "qc_passed": sum(r["qc"]["passed"] for r in done),
           "retried": sum(r["qc"]["attempts"] > 1 for r in done), "wall_s": round(time.time() - t0),
           "issue_counts": {}}
    for r in done:
        for i in r["qc"]["issues"]:
            k = i.split(":")[0]
            rep["issue_counts"][k] = rep["issue_counts"].get(k, 0) + 1
    (OUT.parent / "narration_report.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep))


if __name__ == "__main__":
    main()
