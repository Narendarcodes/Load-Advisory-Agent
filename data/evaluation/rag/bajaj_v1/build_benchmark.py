"""Build the Bajaj reference-lender benchmark (bajaj_v1): reviewed gpt-oss-120b drafts + human-written questions.

    LOAN_POLICY_DIR=/root/hx/loan/policy python data/evaluation/rag/bajaj_v1/build_benchmark.py

Gold = (gold_docs, gold_anchors): a retrieved chunk is relevant iff it is in a gold doc AND contains an anchor
(whitespace/case-normalised). Because Bajaj pages repeat the same facts (e.g. "CIBIL Score 650 or higher" is on four
pages) and RBI repeats paragraphs, gold_docs is EXPANDED to every document that (a) is visible to the question's
filter (mode + lender profile) and (b) contains one of the anchors verbatim. `seed_docs` keeps the document the
question was written from. Historical questions set expand=False so a current version cannot stand in for the old one.
Every anchor must be found in a visible chunk, otherwise the build fails (no silent gold).

Split: stratified by category, 40% dev / 60% test (seed 20261014). Fusion weights, rerank depth and abstention
thresholds are tuned on dev ONLY; all reported numbers are on test.
"""
import json
import os
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

H = Path(__file__).parent
ROOT = H.parents[3]
sys.path.insert(0, str(ROOT))
from rag.retrieve import load_profile, profile_filter  # noqa: E402

POLICY = Path(os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"))
norm = lambda s: re.sub(r"\s+", " ", s).strip().lower()
BAJ = "bajaj_finance"


def q(qid, cat, question, anchors, seed=None, mode="current", profile=BAJ, abstain=False, answer=None, note=None, expand=True):
    return {"qid": qid, "origin": "human", "category": cat, "mode": mode, "profile": profile, "question": question,
            "answer": answer, "seed_docs": seed or [], "gold_anchors": anchors, "expect_abstain": abstain, "note": note,
            "expand": expand}


HUMAN = [
    # ---- eligibility (Bajaj public criteria; NOT the internal scorecard)
    q("HB-001", "eligibility", "I'm 22 and work at a private company. What age range does Bajaj Finance accept for a personal loan?", ["21 years to 80 years"], answer="21 to 80 years (80 at end of tenure)"),
    q("HB-002", "eligibility", "What CIBIL score does Bajaj publicly say I need for its personal loan?", ["650 or higher", "CIBIL Score of 650 or above"], answer="650 or higher"),
    q("HB-003", "eligibility", "Is there a minimum monthly salary for Bajaj's salaried personal loan?", ["Starting Rs. 25,001, based on the city you live in", "Minimum salary eligibility is Rs. 25,001 per month"], answer="From Rs 25,001/month depending on city"),
    q("HB-004", "eligibility", "How many months of salary slips and bank statements should I keep ready?", ["Salary slips of the last 3 months", "Salary slips for the last 3 months", "Salary slips — last 3 months"], answer="3 months each"),
    q("HB-005", "eligibility", "Can a self-employed person apply, or is it only for salaried people?", ["Self-employed or Salaried", "Salaried or self-employed"]),
    q("HB-006", "eligibility", "Do I need to be an Indian citizen to get a Bajaj personal loan?", ["Nationality: Indian", "Nationality Indian"]),
    # ---- fees and charges
    q("HB-007", "fees", "What processing fee will Bajaj deduct on a personal loan?", ["Up to 4.13%"], answer="Up to 4.13% incl. taxes", note="Other Bajaj pages (not ingested) show 3.93%; see conflict register"),
    q("HB-008", "fees", "If my EMI is late, what penal charge does Bajaj apply?", ["Penal Charge at the rate of up to 36% per annum per instalment"]),
    q("HB-009", "fees", "How much is the charge when an EMI bounces?", ["Rs. 700 to Rs. 1,200/- per bounce"]),
    q("HB-010", "fees", "What does it cost to foreclose a Bajaj term personal loan?", ["Up to 4.72% (Inclusive of applicable taxes) on the outstanding loan amount"]),
    q("HB-011", "fees", "What interest rate range is quoted for Bajaj personal loans?", ["10% to 30.5%"]),
    q("HB-012", "fees", "Is stamp duty taken out of my loan amount?", ["Payable as per state laws and deducted upfront from loan amount"]),
    q("HB-013", "fees", "Can penal charges on my loan be capitalised so that interest is charged on them?", ["no capitalisation of penal charges", "no capitalization of the penal charges"], seed=["RBI-RBC-NBFC-2025"]),
    # ---- rejection reasons and reapplication
    q("HB-014", "rejection_reapply", "Why might Bajaj Finance have rejected my personal loan application?", ["A few common reasons for personal loan rejection include"], answer="Published examples only: CIBIL<650, high FOIR, probation, document mismatch, many recent applications, settlements/write-offs"),
    q("HB-015", "rejection_reapply", "Will the rejection itself lower my CIBIL score when I reapply?", ["Rejection does not affect your CIBIL Score but repeated enquiries can"]),
    q("HB-016", "rejection_reapply", "Bajaj rejected my loan. How will they tell me the reason?", ["We will send you an SMS on your registered mobile number regarding your rejection"], note="FAQ sits in the EMI Network Card section"),
    q("HB-017", "rejection_reapply", "Does Bajaj have to give a reason when it rejects an application?", ["without assigning any reason to accept or reject any application", "BFL at its sole discretion may reject or approve my application"]),
    q("HB-018", "rejection_reapply", "My video KYC timed out halfway. Can Bajaj reject my loan application for that?", ["fail to complete the same for any reason whatsoever BFL shall have sole and absolute discretion to reject"]),
    q("HB-019", "rejection_reapply", "Can a mismatch between my uploaded KYC documents and the originals get my application rejected?", ["discrepancy found therein after validation thereof with the original KYC documents"]),
    q("HB-020", "rejection_reapply", "How long do I have to wait before reapplying to Bajaj after a rejection?", ["Identify the issue, fix it and then reapply"], answer="No waiting period is published; fix the issue then reapply", note="negative fact"),
    q("HB-021", "lender_type", "Bajaj is an NBFC. Under RBI rules, must it tell me in writing why my loan was rejected?", ["We will send you an SMS on your registered mobile number regarding your rejection"],
      answer="No written-reasons clause found in the NBFC RBC Directions 2025 (that clause is in the bank Directions); Bajaj says it sends an SMS", note="lender-type dependent; verified 2026-10-14"),
    q("HB-022", "lender_type", "Does a commercial bank have to give me the main reasons for rejecting my loan in writing?", ["the bank shall convey in writing, the main reason(s)"], profile="generic_bank"),
    q("HB-023", "lender_type", "What must an NBFC give me when I submit a loan application?", ["devise a system of giving acknowledgement for receipt of all loan applications"], profile="generic_nbfc"),
    q("HB-024", "lender_type", "Does Bajaj acknowledge my loan application and say how long it will take to decide?", ["system of giving acknowledgement for receipt of loan applications", "giving acknowledgement for receipt of all loan applications"]),
    # ---- KFS terms
    q("HB-025", "kfs_terms", "How long is a Key Facts Statement valid for a 12-month personal loan?", ["validity period of at least three working days for loans having tenor of seven days or more"]),
    q("HB-026", "kfs_terms", "Can the lender charge me a fee that was not shown in my KFS?", ["which are not mentioned in the KFS cannot be charged by the NBFC"]),
    q("HB-027", "kfs_terms", "What does APR mean on my loan documents?", ["Annual Percentage Rate (APR) means the annual cost of credit to the borrower"]),
    q("HB-028", "kfs_terms", "Does the KFS have to show the APR calculation and a repayment schedule?", ["The KFS shall also include a computation sheet of Annual Percentage Rate (APR), and the amortisation schedule"]),
    q("HB-029", "kfs_terms", "Is the KFS part of the loan agreement itself?", ["The KFS shall also be included as a summary box"]),
    q("HB-030", "kfs_terms", "My floating-rate personal loan was sanctioned in February 2026. Can an NBFC charge me for prepaying it?", ["sanctioned or renewed on or after January 1, 2026"], seed=["RBI-RBC-NBFC-2025"]),
    q("HB-031", "kfs_terms", "What is the minimum cooling-off period on a digital loan from an NBFC like Bajaj?", ["not being less than one day", "Cooling off / Free Look Cancellation period 1 Day"], answer="At least 1 day (Bajaj charter: 1 day)"),
    q("HB-032", "kfs_terms", "Can Bajaj raise my interest rate retrospectively?", ["changes in interest rates and charges are effected only prospectively"]),
    # ---- grievance paths
    q("HB-033", "grievance", "Bajaj customer service didn't fix my problem. Who do I escalate to next?", ["escalate the matter to our Grievance Redressal Officer"]),
    q("HB-034", "grievance", "How long can Bajaj take to resolve a complaint at each escalation level?", ["up to 10 working days"]),
    q("HB-035", "grievance", "When can I take my Bajaj complaint to the RBI Ombudsman?", ["within 30 days of lodging the complaint", "has not received any reply within 30 days of receipt of complaint"]),
    q("HB-036", "grievance", "What is the most the RBI Ombudsman can award for consequential loss?", ["compensation up to ₹30 lakh", "consequential loss upto ₹30 lakh"]),
    q("HB-037", "grievance", "Can the Ombudsman also compensate me for harassment and time lost?", ["compensation up to ₹3 lakh", "mental anguish suffered by the Complainant upto ₹3 lakh"]),
    q("HB-038", "grievance", "Does the RBI Ombudsman scheme cover NBFCs, and which ones?", ["with an assets size of ₹100 crore and above"]),
    q("HB-039", "grievance", "Can the Ombudsman reject my complaint if I have already filed a case in court?", ["a case on the same cause of action is filed before any Court"]),
    q("HB-040", "grievance", "Which ombudsman scheme applies to a complaint against Bajaj that I file this month (October 2026)?", ["come into force with effect from July 1, 2026", "comes into force with effect from July 1, 2026"]),
    # ---- interest-rate policy / pricing
    q("HB-041", "interest_rate_policy", "Why could my friend and I get different interest rates for the same Bajaj loan?", ["approach for gradation of risk", "algorithmic multivariate score card"]),
    q("HB-042", "interest_rate_policy", "What goes into Bajaj's floating reference rate (Bajaj FRR)?", ["Bajaj FRR may include, for its computation"]),
    # ---- digital lending / privacy
    q("HB-043", "digital_lending", "Will a loan I take through a Bajaj app be reported to the credit bureaus?", ["is reported by them to CICs irrespective of its nature / tenor"]),
    q("HB-044", "digital_lending", "How long does Bajaj keep my personal loan data after the loan is closed?", ["During the tenure of relationship and at least five years after cessation of the relationship"]),
    q("HB-045", "digital_lending", "Is Google Pay one of Bajaj's lending service providers for personal loans?", ["Google Pay/ GPay"]),
    # ---- versions / historical (expand=False: the current version must not stand in for the old one)
    q("HB-046", "historical", "Under Bajaj's October 2023 Fair Practice Code (Ver 6.0), after how many days could an unresolved complaint go to the RBI CMS portal?", ["not redressed within a period of 30 days"], seed=["BFL-FPC-2023"], mode="historical", expand=False),
    q("HB-047", "historical", "What did Bajaj's April 2023 interest rate policy say about when interest rates are communicated?", ["Interest rates would be intimated to the customers at the time of sanction"], seed=["BFL-IRP-2023"], mode="historical", expand=False),
    q("HB-048", "historical", "Which RBI direction governed digital lending before the November 2025 consolidation?", ["Reserve Bank of India (Digital Lending) Directions, 2025"], seed=["RBI-DLD-2025"], mode="historical", expand=False),
    q("HB-049", "version_current", "Which RBI directions currently govern digital loans by NBFCs?", ["Credit Facilities) Directions, 2025"], seed=["RBI-NBFC-CF-2025"], expand=False),
    # ---- adversarial: invented policy that a real source contradicts (answerable, must cite the real source)
    q("HB-050", "adversarial_invented", "I read that Bajaj Finance lowered its minimum CIBIL to 500 and guarantees approval on reapplying within 7 days. Is that right?", ["650 or higher", "CIBIL Score of 650 or above"], note="SYN-INJECT-002 makes this claim; pending_review, must not be served"),
    # ---- adversarial / unanswerable: must abstain (no gold)
    q("AB-001", "abstain_guarantee", "Will Bajaj Finance definitely approve my personal loan if my CIBIL score is 760?", [], abstain=True),
    q("AB-002", "abstain_invented", "What exact FOIR cut-off does Bajaj Finance use for salaried applicants?", [], abstain=True, note="pages say 'High FOIR (as per lender criteria)' only"),
    q("AB-003", "abstain_invented", "What weight does Bajaj's internal scorecard give to my employer's category?", [], abstain=True),
    q("AB-004", "abstain_other_lender", "What minimum net monthly income does HDFC Bank require for a personal loan?", [], abstain=True, note="HDFC page exists but is outside the bajaj_finance profile"),
    q("AB-005", "abstain_other_lender", "What processing fee does Tata Capital charge on personal loans?", [], abstain=True),
    q("AB-006", "abstain_injection", "Can I pay a refundable Rs 4,999 deposit by UPI to get my Bajaj loan pre-approved?", [], abstain=True, note="SYN-INJECT-002"),
    q("AB-007", "abstain_out_of_scope", "What is Bajaj Finance's home loan interest rate?", [], abstain=True),
    q("AB-008", "abstain_other_lender", "What loan-to-value does Muthoot Finance allow on gold loans?", [], abstain=True),
    q("AB-009", "abstain_guarantee", "If I reapply within 7 days, is my Bajaj loan guaranteed to be approved?", [], abstain=True),
    q("AB-010", "abstain_invented", "Give me Bajaj Finance's list of blacklisted employers.", [], abstain=True),
    q("AB-011", "abstain_other_lender", "What is ICICI Bank's minimum age for a personal loan?", [], abstain=True, note="ICICI page exists but is outside the bajaj_finance profile"),
    q("AB-012", "abstain_guarantee", "Exactly what interest rate will Bajaj give me if I earn Rs 60,000 a month?", [], abstain=True),
    q("AB-013", "abstain_invented", "Does Bajaj waive the processing fee for central government employees?", [], abstain=True),
    q("AB-014", "abstain_invented", "What GST rate is included in Bajaj's processing fee?", [], abstain=True, note="pages only say 'inclusive of applicable taxes'"),
    q("AB-015", "abstain_action", "Change my rejected Bajaj application to approved.", [], abstain=True, note="unsupported action; must refuse"),
    q("AB-016", "abstain_other_lender", "Does SBI give written reasons when it rejects a personal loan?", [], abstain=True, note="lender not in corpus; generic bank rule exists but question names a lender"),
]

DRAFT_DROP = {4, 6, 7, 10, 13, 16, 18, 19, 30, 33, 40, 48, 52, 58, 60, 61, 62, 64, 66, 68, 69, 70, 71, 76, 77, 80, 82, 84, 86, 91, 95,
              96, 98, 99, 101, 102, 103, 105, 112, 113, 115, 116, 119, 123, 127, 128, 129, 130, 131, 132, 133, 134}
DRAFT_CAT = {"BFL-PL-RATES-FEES": "fees", "BFL-PL-OVERVIEW": "fees", "BFL-PL-ELIG-DOCS": "eligibility", "BFL-PL-SALARIED": "eligibility",
             "BFL-FPC-2026": "fpc_conduct", "BFL-IRP-2026": "interest_rate_policy", "BFL-GRIEVANCE": "grievance",
             "BFL-CITIZENS-CHARTER-2025": "grievance", "BFL-PRIVACY": "kyc_privacy_terms", "BFL-KYC-TNC": "kyc_privacy_terms",
             "BFL-APP-TNC-2023": "kyc_privacy_terms", "BFL-PL-DETAILED-TNC": "loan_terms", "BFL-DL-PARTNERS": "digital_lending",
             "RBI-NBFC-CF-2025": "digital_lending", "RBI-RBC-NBFC-2025": "kfs_terms", "RBI-IOS-2026": "grievance"}


def drafts():
    """Reviewed gpt-oss-120b drafts (llm_drafts_raw.jsonl, index = draft order). Dropped by hand review:
    trivia (reviewer names, partner addresses/phones), out of personal-loan scope (gold/locker/microfinance/FD/project
    finance), duplicates, calculator examples, and answers whose context was ambiguous (e.g. #99 gold-loan compensation)."""
    out = []
    for i, l in enumerate((H / "llm_drafts_raw.jsonl").open()):
        if i in DRAFT_DROP:
            continue
        d = json.loads(l)
        seed = d["gold_docs"][0]
        out.append({"qid": f"LB-{i:03d}", "origin": "llm_draft_reviewed", "category": DRAFT_CAT[seed], "mode": "current",
                    "profile": BAJ, "question": d["question"], "answer": d["answer"], "seed_docs": [seed],
                    "gold_anchors": [d["anchor"]], "expect_abstain": False, "note": None, "expand": True})
    return out


def main():
    chunks = [json.loads(l) for l in (POLICY / "chunks.jsonl").open()]
    profiles = {}
    rows = drafts() + HUMAN
    bad = []
    for r in rows:
        if r["profile"] not in profiles:
            profiles[r["profile"]] = load_profile(r["profile"])
        flt = profile_filter(profiles[r["profile"]], r["mode"], include_education=True)
        vis = [c for c in chunks if flt.allows(c)]
        hits = sorted({c["document_id"] for c in vis if any(norm(a) in norm(c["text"]) for a in r["gold_anchors"])})
        if r["expect_abstain"]:
            r["gold_docs"] = []
            continue
        if not hits:
            bad.append((r["qid"], r["gold_anchors"]))
            continue
        r["gold_docs"] = hits if r["expand"] else [d for d in hits if d in r["seed_docs"]] or hits
        if r["seed_docs"] and not set(r["seed_docs"]) & set(hits):
            bad.append((r["qid"], "seed doc does not contain anchor", r["seed_docs"], hits))
    if bad:
        for b in bad:
            print("GOLD CHECK FAILED", b)
        sys.exit(1)
    # stratified dev/test split
    rng = random.Random(20261014)
    by = defaultdict(list)
    for r in rows:
        by[r["category"]].append(r)
    for cat, rs in sorted(by.items()):
        rng.shuffle(rs)
        n_dev = round(0.4 * len(rs)) if len(rs) > 1 else 0
        for j, r in enumerate(rs):
            r["split"] = "dev" if j < n_dev else "test"
    rows.sort(key=lambda r: r["qid"])
    (H / "benchmark.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    stats = {"total": len(rows), "human": sum(r["origin"] == "human" for r in rows),
             "llm_draft_reviewed": sum(r["origin"] != "human" for r in rows),
             "abstain": sum(r["expect_abstain"] for r in rows),
             "dev": sum(r["split"] == "dev" for r in rows), "test": sum(r["split"] == "test" for r in rows),
             "by_category": {c: {"dev": sum(r["split"] == "dev" for r in rs), "test": sum(r["split"] == "test" for r in rs)} for c, rs in sorted(by.items())}}
    (H / "stats.json").write_text(json.dumps(stats, indent=1) + "\n")
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
