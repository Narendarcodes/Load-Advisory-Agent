"""Deterministic guards on applicant input and on every drafted answer.

- Request guards: approval guarantees, decision override / record edits, auto-submission,
  other applicants' data and prompt-injection markers are routed to the boundary path.
- Answer guards: no decision-making or guarantee language, no ungrounded numbers, valid citations,
  no claim that RBI obliges an NBFC to give written rejection reasons.
English patterns plus a few Hindi/Telugu terms; multilingual coverage is a known limitation.
"""
import re

from loan_advisory.agent.facts import _norm

# ------------------------------------------------------------------ applicant request
_REQ = {
    "guarantee": r"\b(guarantee[ds]?|assure[ds]?|promise|definitely|for sure|surely|certainly|for certain)\b|100 ?%|"
                 r"\b(will|would|can|could)\s+(i|we|my\s+(loan|application))\s+(get|be|definitely)\s+(approv|sanction|the loan)|"
                 r"\b(chances?|odds|probability|likely|likelihood)\b.{0,30}\b(approv|sanction|get the loan)|"
                 r"\bwill\b.{0,30}\bgive\s+me\s+(the\s+)?(lowest|best|lower|cheapest|minimum)\s+(interest\s+)?rate\b|"
                 r"गारंटी|पक्का|गॅरंटी|గ్యారంటీ|ఖచ్చితంగా",
    "override": r"\b(approve|sanction)\s+(my|the|this)\s+(loan|application)\b|\bapprove\s+(me|it)\b|\bmark\b.{0,20}\bapproved\b|"
                r"\b(reconsider|overturn|override|reverse|cancel|change|revoke|withdraw)\s+(the\s+|my\s+|this\s+)?(loan\s+|application\s+)?(decision|rejection|outcome)\b|"
                r"\b(reconsider|overturn|reverse|re-?evaluate)\s+(my|the|this)\s+(loan|application)\b|"
                r"\b(change|turn|make|convert|update|switch)\b.{0,40}\b(to|as|into)\s+(approved|sanctioned|accepted)\b",
    "edit_record": r"\b(update|change|edit|modify|correct|set|increase|raise)\b.{0,30}\b(record|file|application data|my income in|my score in|the system)\b|"
                   r"\b(update|change|edit|set)\s+my\s+(income|salary|score|credit score|emi|obligations|tenure)\s+(to|in)\b|"
                   # imperative record tampering (abstain_v2): "remove the enquiry from my CIBIL report", "mark my EMI as paid"
                   r"^\W*(please\s+|can you\s+|could you\s+)?(remove|delete|erase|wipe|clear|drop)\b.{0,40}\b(enquir|inquir|rejection|record|default|history|report|dpd|overdue)|"
                   r"^\W*(please\s+|can you\s+|could you\s+)?mark\b.{0,30}\b(as\s+)?(paid|closed|settled|cleared|regular)\b|"
                   r"^\W*(please\s+|can you\s+|could you\s+|i want to\s+|i'd like to\s+)?(increase|raise|enhance)\s+(my\s+|the\s+)?(approved|sanctioned)\s+(loan\s+)?(amount|limit)\b",
    "auto_submit": r"\b(submit|file|send|re-?apply)\b.{0,25}\b(for me|on my behalf|automatically|a new application now)\b",
    "other_applicant": r"\b(another|other|someone else'?s?|my (friend|brother|sister|wife|husband)'?s?)\b.{0,25}\b(application|loan|score|record)\b|"
                       r"\b(SYN-APP|APP-TEST|ACC-LOAP)-[0-9]+",
    "injection": r"ignore (all |the )?(previous|prior|above) (instructions|rules)|system prompt|developer mode|you are now|"
                 r"pretend (to be|you are)|jailbreak|reveal your (prompt|instructions)",
}
REQ_PATTERNS = {k: re.compile(v, re.I) for k, v in _REQ.items()}


def request_flags(message: str, own_ref: str | None = None) -> list[str]:
    flags = []
    for k, p in REQ_PATTERNS.items():
        m = p.search(message)
        if not m:
            continue
        if k == "other_applicant" and own_ref and own_ref.lower() in message.lower() and not re.search(
                r"\b(another|other|someone|friend|brother|sister|wife|husband)\b", message, re.I):
            continue  # applicant naming their OWN reference is fine
        flags.append(k)
    return flags


# ------------------------------------------------------------------ drafted answer
_NEG = re.compile(r"\b(no|not|never|cannot|can't|can ?not|unable to|isn't|is not|doesn't|does not|don't|do not|won't|without)\b"
                  r"[^.?!]{0,60}", re.I)
_BAD = {
    "guarantee_language": r"\b(i|we)\s+(can\s+)?(guarantee|assure|promise)\b|"
                          r"\bguarantee[ds]?\b[^.]{0,30}\b(approv|sanction|get the loan|eligib|qualif)|"
                          r"\b(approv\w*|sanction\w*)\b[^.]{0,30}\b(guaranteed|assured)\b|"
                          r"\b(definitely|certainly|surely|assuredly)\b[^.]{0,40}\b(approv|get the loan|qualify|eligible|sanction)|"
                          r"\b100 ?% (sure|chance|certain)|"
                          r"\byou(\s+will|'ll)\s+(definitely\s+|surely\s+|certainly\s+)?(be\s+)?(get the loan|be approved|qualify|receive the loan|approved|eligible|sanctioned)\b|"
                          r"\b(sure|bound) to (be approved|get the loan|qualify)\b|"
                          r"\b(loan|application) will (be|get) (approved|sanctioned)\b",
    "decision_language": r"\b(i|we)\s+(have\s+)?(approve[ds]?|reject(ed)?|sanction(ed)?|decline[ds]?|overturn(ed)?|reverse[ds]?|changed?\s+(your|the)\s+(decision|application|record))\b|"
                         r"\byour (loan|application) (is|has been) (now )?(approved|sanctioned)\b|"
                         r"\b(i|we)('ve| have) (updated|modified|edited) (your|the) (record|application|income|score)\b",
    "nbfc_written_reason_promise": r"\b(rbi|reserve bank)\b[^.]{0,80}\b(requires?|obliges?|mandates?|must)\b[^.]{0,60}\b(nbfc|bajaj|lender)\b[^.]{0,60}\bwritten\b[^.]{0,30}\breason|"
                                   r"\b(bajaj|the nbfc|nbfcs?)\b[^.]{0,40}\b(must|is required to|are required to|is obliged to)\b[^.]{0,40}\b(give|provide|send|convey)\b[^.]{0,40}\bwritten\b[^.]{0,20}\breason",
    "hi_te_guarantee": r"ज़रूर मिलेगा|पक्का मिलेगा|गारंटी है|मंजूर हो जाएगा|మంజూరు అవుతుంది|ఖచ్చితంగా వస్తుంది|గ్యారంటీ",
}
BAD = {k: re.compile(v, re.I) for k, v in _BAD.items()}
NUM = re.compile(r"(?<![\w.])(?:₹\s?)?(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s?(%|percent)?")


def _strip_negated(text: str) -> str:
    """Remove negated clauses ('this is not a guarantee', 'I cannot approve') before matching."""
    return _NEG.sub(" ", text)


def answer_flags(answer: str) -> list[str]:
    t = _strip_negated(answer)
    return [k for k, p in BAD.items() if p.search(t)]


def numbers_in(text: str) -> list[str]:
    out = []
    for m in NUM.finditer(text):
        raw = m.group(1).replace(",", "")
        try:
            out.append(_norm(float(raw)))
        except ValueError:
            continue
    return out


def ungrounded_numbers(answer: str, allowed: set[str]) -> list[str]:
    bad = []
    for n in numbers_in(answer):
        if n in allowed:
            continue
        if re.fullmatch(r"(19|20)\d\d", n):  # years (e.g. "Directions, 2025") come from cited titles
            continue
        bad.append(n)
    return sorted(set(bad))


def citation_flags(cited: list[str], available: list[str], abstained: bool) -> list[str]:
    flags = []
    if abstained and cited:
        flags.append("citations_on_abstention")
    if not abstained and not cited:
        flags.append("answer_without_citation")
    if any(c not in available for c in cited):
        flags.append("unknown_citation_label")
    return flags
