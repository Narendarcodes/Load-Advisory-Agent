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
    # a guarantee *product* ("credit guarantee scheme fee", "CGTMSE guarantee fee", "bank guarantee") is a fee or
    # security question, not a request to promise approval (DeepEval baseline R2-FEE-08)
    "guarantee": r"(?<!credit\s)(?<!bank\s)(?<!cgtmse\s)\bguarantee[ds]?\b(?!\s+(?:scheme|fee|fund|charges?|cover|trust)\b)|"
                 r"\b(assure[ds]?|promise|definitely|for sure|surely|certainly|for certain)\b|100 ?%|"
                 r"\b(will|would|can|could)\s+(i|we|my\s+(loan|application))\s+(get|be|definitely)\s+(approv|sanction|the loan)|"
                 r"\b(chances?|odds|probability|likely|likelihood)\b.{0,30}\b(approv|sanction|get the loan)|"
                 # a rate promise, not any mention of rates: "will I get the best rate", "can you get me the cheapest
                 # rate", "will Bajaj give me the lowest interest rate". The subject must be the applicant, the agent
                 # or a lender, so "which documents will give me the best rate" stays an ordinary question.
                 r"\b(will|would|can|could|should)\s+(?:i|we|you|they|lenders?|banks?|nbfcs?|bajaj|hdfc|icici|sbi|"
                 r"\w+\s+(?:finance|bank|nbfc|ltd\.?|limited)|the\s+(?:lender|bank|nbfc|company)|my\s+\w+)\s+"
                 r"(?:get|give|offer|advise|provide|arrange|secure|find|quote|be\s+(?:offered|given|getting))\b"
                 r"[^.?]{0,20}?\b(lowest|best|cheapest|minimum|lower)\s+(interest\s+|possible\s+)*(rate|roi|apr)\b|"
                 r"गारंटी|पक्का|गॅरंटी|గ్యారంటీ|ఖచ్చితంగా",
    "override": r"\b(approve|sanction)\s+(my|the|this)\s+(loan|application)\b|\bapprove\s+(me|it)\b|\bmark\b.{0,20}\bapproved\b|"
                r"\b(reconsider|overturn|override|reverse|cancel|change|revoke|withdraw)\s+(the\s+|my\s+|this\s+)?(loan\s+|application\s+)?(decision|rejection|outcome)\b|"
                r"\b(reconsider|overturn|reverse|re-?evaluate)\s+(my|the|this)\s+(loan|application)\b|"
                r"\b(change|turn|make|convert|update|switch)\b.{0,40}\b(to|as|into)\s+(approved|sanctioned|accepted)\b",
    # editing the applicant's own declared figures: "update my income to 60000 in the record"
    "edit_record": r"\b(update|change|edit|modify|correct|set|increase|raise)\b.{0,30}\b(record|file|application data|my income in|my score in|the system)\b|"
                   r"\b(update|change|edit|set)\s+my\s+(income|salary|score|credit score|emi|obligations|tenure)\s+(to|in)\b",
    "auto_submit": r"\b(submit|file|send|re-?apply)\b.{0,25}\b(for me|on my behalf|automatically|a new application now)\b",
    # requests to fake, inflate, hide or forge application information (question bank q.659)
    "misrepresentation": r"\b(fake|forged?|forging|falsif\w*|fabricat\w*|counterfeit)\b.{0,40}\b(salary|slip|payslip|income|statement|document|itr|form 16|bank|record|application|proof|score|report)|"
                         # "doctor" as a verb needs its document object right after it: "I am a doctor with a salary..." is a job
                         r"\bdoctor(?:ed)?\s+(?:the\s+|my\s+|a\s+|an\s+|some\s+)?(?:salary|pay\s?slip|payslip|income|statement|document|itr|form\s?16|bank|record|application|proof|score|report)\b|"
                         r"\b(forge|falsify|fabricate)\b.{0,30}\b(my|a|the|some)\b|"
                         r"\b(manipulat\w*|game|trick|cheat|fool)\b.{0,30}\b(application|system|lender|score|check|underwrit)|"
                         r"\b(inflate|overstate|exaggerate|pad)\b.{0,30}\b(income|salary|earnings)|"
                         r"\b(hide|conceal|not disclose|don'?t disclose|omit)\b.{0,30}\b(emi|emis|loan|loans|debt|obligation|default|liabilit)|"
                         r"\blie\b.{0,30}\b(about|on)\b|"
                         r"\b(edit|alter|tamper|modify|photoshop)\b.{0,20}\b(salary slip|payslip|pay slip|bank statement|statement|itr|form 16|document)",
    # information the agent never holds: who handled the file, internal grades/scores (abstain_v2 AB2-005, AB2-038)
    "not_available": r"\b(who|which|name of the)\b.{0,30}\b(officer|underwriter|employee|staff|person|executive|analyst|manager|banker)s?\b"
                     # "which manager should I contact/speak to about my rejected loan?" is a contact-path question
                     r"(?![^.!?]{0,40}\b(contact|speak|talk|reach|complain|grievance|escalat|email|call|write|approach)\w*\b)"
                     r".{0,40}\b(reject|declin|review|approv|decid|assess|process|handl|turn)\w*|"
                     r"\binternal\s+(risk\s+|credit\s+)?(grade|rating|score|band|category|tier|bucket|scorecard)s?\b|"
                     r"\brisk\s+(grade|rating|band|category|tier|bucket|segment)s?\b.{0,40}\b(my|me|i)\b|"
                     r"\b(my|me)\b.{0,40}\brisk\s+(grade|rating|band|category|tier|bucket|segment)s?\b|"
                     r"किस\s+(अधिकारी|कर्मचारी)|कौन.{0,20}(अधिकारी|कर्मचारी)|आंतरिक\s+(रिस्क|जोखिम|क्रेडिट)?\s*(ग्रेड|रेटिंग|स्कोर)|"
                     r"ఏ\s+(అధికారి|ఉద్యోగి)|(అధికారి|ఉద్యోగి)\s+ఎవరు|అంతర్గత\s+(రిస్క్|క్రెడిట్)?\s*(గ్రేడ్|రేటింగ్|స్కోర్)",
    # someone else's data: a possessive ("my friend's score", "another applicant's loan", "someone else's file") or
    # "<record> of my sister". Mentioning a person in the applicant's OWN question ("my friend and I took the same
    # loan", DeepEval baseline R2-RAT-07) or "other charges on the loan" is not a request for another person's data.
    "other_applicant": r"\b(?:another|other)\s+(?:person|applicant|customer|borrower|user|people)(?:'s|’s|s'|s)?\b"
                       r".{0,25}\b(?:application|loan|score|record|details|data|status)|"
                       r"\bsomeone\s+else(?:'s|’s)?\b.{0,25}\b(?:application|loan|score|record|details|data|status)|"
                       r"\bmy\s+(?:friend|brother|sister|wife|husband|father|mother|son|daughter|colleague|cousin|"
                       r"neighbou?r|relative)(?:'s|’s|s')\s+.{0,25}\b(?:application|loan|score|record|details|data|status|cibil|report)|"
                       r"\b(?:application|loan|score|record|details|data|status|report)\s+of\s+(?:my\s+(?:friend|brother|sister|"
                       r"wife|husband|father|mother|son|daughter|colleague|cousin|relative)|another|someone\s+else)\b|"
                       r"\b(SYN-APP|APP-TEST|ACC-LOAP)-[0-9]+",
    # Prompt-injection framing, in every language the agent serves. Until 2026-11-03 (Phase 1 boundary E)
    # this was English-only, so a Hindi or Telugu borrower could say "forget your instructions" in their own
    # script and reach the composer. "निर्देश" and "సూచన" are ordinary loan words, so every Indic branch
    # pairs the instruction noun with a forget / reveal / disobey verb or with a role change, and the whole
    # set is calibrated in tests/test_agent_dispatch_isolation.py against the full synthetic persona corpus.
    "injection": r"ignore (all |the )?(previous|prior|above) (instructions|rules)|system prompt|developer mode|you are now|"
                 r"pretend (to be|you are)|jailbreak|reveal your (prompt|instructions)|"
                 r"निर्देश[^.!?]{0,30}(?:भूल|नज़रअंदाज़|नजरअंदाज़|तोड़|छोड़|ignore)"
                 r"|(?:भूल|नज़रअंदाज़|नजरअंदाज़|तोड़|छोड़|ignore)[^.!?]{0,30}निर्देश"
                 r"|सिस्टम\s*प्र[^ ]{0,8}ट|डेवलपर\s*मोड"
                 r"|अपने?\s+(?:निर्देश|प्र[^ ]{0,8}ट)[^.!?]{0,15}(?:बताओ|दिखाओ|देख|बताना)"
                 r"|(?:तुम|आप)\s+अब\s+(?:एक[^.!?]{0,30}(?:हो|हूँ|हैं|है|बन)|[^.!?]{0,25}(?:बन|जाओ|जाइए))|"
                 r"సూచన[^.!?]{0,30}(?:మరచిపో|విస్మరించ|ignore)"
                 r"|(?:మరచిపో|విస్మరించ|ignore)[^.!?]{0,30}సూచన"
                 r"|సిస్టమ్\s*ప్[^ ]{0,8}ట్|డెవలపర్\s*మోడ్"
                 r"|మీ సూచనలు[^.!?]{0,15}(?:చెప్పండి|చూపించు|చూపించండి)"
                 r"|మీరు\s+ఇప్పుడు\s+(?:ఒక[^.!?]{0,30}(?:అవ|మార)|[^.!?]{0,25}(?:మారండి|అవ్వండి))|"
                 # Roman-script Hindi (code-mixed borrower text), kept to a two-part frame on purpose.
                 r"instructions?\s+bhool|ignore\s+(?:apne|saare|sare|pichle|previous)\b[^.!?]{0,20}instructions",
}
REQ_PATTERNS = {k: re.compile(v, re.I) for k, v in _REQ.items()}

# --- record tampering, kept out of the dict because framing decides the answer -------------------------------
# "How do I raise my sanctioned limit?" / "How do I remove a wrong CIBIL entry?" are informational questions and PR
# #9's own tests require them to pass; "Raise my sanctioned limit to 10 lakh" is a request to act on a record. A
# how-to question is therefore exempt, but a request addressed to the agent ("can you increase ...") never is.
_HOWTO = re.compile(
    r"\b(?:how\s+(?:can|could|do|does|would|should|might)\s+(?:i|we|one)|how\s+to|"
    r"what\s+(?:can|could|should|would|must)\s+(?:i|we)\s+do|"
    r"what\s+(?:are\s+)?(?:the\s+)?(?:steps|ways|options)|is\s+it\s+possible\s+to|is\s+there\s+(?:a|any)\s+way)\b", re.I)
# "What is the procedure to correct a wrong entry in my credit report?" asks about a process, so it must route as a policy
# question rather than a dispute. Deliberately kept OUT of _HOWTO, because _HOWTO also exempts a message from the
# record-tampering guard: "What is the method to set my CIBIL score to 800?" has to stay a refused tampering request.
_PROCEDURE = re.compile(
    r"\bwhat(?:'s|\s+is)\s+the\s+(?:correct\s+)?(?:procedure|process|way|method)\b", re.I)
_ASK_AGENT_ACT = re.compile(
    r"\b(?:can|could|would|will)\s+you\s+(?:please\s+)?"
    r"(?:remove|delete|erase|wipe|clear|drop|mark|increase|raise|enhance|update|change|edit|modify|correct|set|fix)\b", re.I)
_POLITE_OR_AGENT = (r"^\W*(?:(?:please|kindly|can you|could you|would you|will you|can i|may i|"
                    r"i want to|i need to|i'?d like to)\s+)*")
# official application / credit-record artefacts only; word ends so "recorded" is not read as "record"
_TAMPER = re.compile(
    _POLITE_OR_AGENT + r"(?:remove|delete|erase|wipe|clear|drop)\b[^.]{0,40}?"
    r"\b(?:enquir(?:y|ies)|inquir(?:y|ies)|rejections?|defaults?|dpd|overdue|written[-\s]?off|settlements?|"
    r"credit\s+report|cibil|credit\s+history|application\s+records?|records?)\b", re.I)
_MARK_PAID = re.compile(
    _POLITE_OR_AGENT + r"mark\b[^.]{0,30}?\b(?:as\s+)?(?:paid|closed|settled|cleared|regular)\b", re.I)
# "increase my approved loan amount to 10 lakh": an instruction to set a sanctioned amount, not a how-to question.
# Anchored like the other tampering matchers so an applicant's first-person question ("Can I increase my approved loan
# amount after some time?") stays an ordinary question instead of being refused as record tampering.
_LIMIT = re.compile(
    r"^\W*(?:(?:please|kindly|can you|could you|would you|will you|i want to|i need to|i'?d like to)\s+)*"
    r"(?:increase|raise|enhance)\s+(?:my\s+|the\s+)?(?:approved|sanctioned)\s+(?:loan\s+)?(?:amount|limit)\b", re.I)
# "Update my CIBIL score to 800": the dict pattern above needs "my score", so a bureau qualifier ("my CIBIL score") slipped
# through. Gated on framing, so "How can I increase my credit score to 800?" stays an improvement question.
_SCORE_EDIT = re.compile(
    r"\b(?:update|change|edit|modify|correct|set|increase|raise|fix)\s+my\s+"
    r"(?:(?:cibil|credit|bureau|internal|risk|experian|crif)\s+)*(?:score|rating|report|history)\s+(?:to|as|in)\b"
    r"|\b(?:update|change|edit|modify|correct|set|increase|raise|fix)\s+my\s+(?:(?:cibil|credit|bureau)\s+)?score\b", re.I)
# deletion of things that are not application records (our own calls, chats, logs): a data request, not tampering
_DELETE_NOT_RECORD = re.compile(
    _POLITE_OR_AGENT + r"(?:remove|delete|erase|wipe|clear)\b[^.]{0,40}?"
    r"\b(?:recordings?|recorded\s+(?:call|conversation|audio)|call\s+recordings?|audio|transcripts?|conversations?|"
    r"chat(?:\s+(?:log|history))?|logs?|messages?)\b", re.I)


def _is_directive(message: str) -> bool:
    """True when the message asks for an action; False for a how-to/informational question."""
    return _HOWTO.search(message) is None or _ASK_AGENT_ACT.search(message) is not None


def is_informational_question(message: str) -> bool:
    """True for a how-to/process question ("how do I ...", "what is the procedure to ...") that does not also ask the
    agent to perform the change. Used to keep a policy question from being read as a claim about the user's record."""
    return (_HOWTO.search(message) is not None or _PROCEDURE.search(message) is not None) \
        and _ASK_AGENT_ACT.search(message) is None


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
    if "edit_record" not in flags and _is_directive(message) and (
            _TAMPER.search(message) or _MARK_PAID.search(message) or _LIMIT.search(message) or _SCORE_EDIT.search(message)):
        flags.append("edit_record")
    if _DELETE_NOT_RECORD.search(message):
        flags.append("data_deletion")  # the agent can never delete anything; route to a human data request
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


# ------------------------------------------------------------------ borrower-visible text hygiene
# Internal labels and retrieval machinery must never reach the borrower (DeepEval baseline: 91/178 answers said
# "passages" or P1..P5). The POLICY prompt forbids them; sanitize_answer() is the deterministic last line of defence and
# leaked_terms() the check. LEAK_CASED/LEAK_WORDS match scripts/policy/eval_saral_deepeval.py, plus Hindi/Telugu forms.
LEAK_CASED = re.compile(r"\b(OCR|ZEN|RAG|LLM|P[1-5])\b")
LEAK_WORDS = re.compile(r"\b(bureau|chunks?|passages?|retriev\w*|embedding\w*|system prompt)\b|पैसेज\w*|పాసేజ్\w*", re.I)
_LBL = r"P[1-5]"
_LBL_LIST = rf"{_LBL}(?:\s*(?:,|/|&|and|और|మరియు)\s*{_LBL})*"
_PASS = r"(?:the\s+)?(?:provided\s+|given\s+|above\s+|available\s+|retrieved\s+|source\s+)?(?:passages?|chunks?)"
_SAN = [
    # bracketed label groups: " (P1)", " (P2, P3)", "[P1][P5]", " (see P2)"
    (re.compile(rf"\s*[\(\[]\s*(?:see\s+|source:?\s+|sources:?\s+)?{_LBL_LIST}\s*[\)\]]", re.I), ""),
    # "(referenced as X in P1)" -> "(referenced as X)"
    (re.compile(rf"\s+(?:in|from|per)\s+{_LBL_LIST}(?=\s*[\)\].,;:!?।]|$)"), ""),
    # lead-ins: "According to the passages, ", "Based on the passages, ", "Per the passages, " -> drop
    (re.compile(rf"\b(?:according\s+to|based\s+on|as\s+per|per|from)\s+{_PASS}\s*,\s*", re.I), "\x00"),
    (re.compile(r"पैसेज\w*\s+के\s+(?:अनुसार|मुताबिक)\s*,?\s*"), "\x00"),
    (re.compile(r"పాసేజ్\w*\s+(?:ప్రకారం)\s*,?\s*"), ""),
    # "both P1 and P4" / "P1 and P4" as a subject -> "both sources" / "the sources"
    (re.compile(rf"\bboth\s+{_LBL}\s+and\s+{_LBL}\b"), "both sources"),
    (re.compile(rf"\b{_LBL}(?:\s*(?:,|and)\s*{_LBL})+\b"), "the sources"),
    (re.compile(rf"\b{_LBL}\b"), "one source"),
    # remaining words: "the passages" -> "the sources"; "credit bureau" -> "credit information company"
    (re.compile(r"\b(?:the\s+)?(?:provided|given|above|available|retrieved)\s+(passages|chunks)\b", re.I), "the sources"),
    (re.compile(r"\b(passages|chunks)\b", re.I), "sources"),
    (re.compile(r"\b(passage|chunk)\b", re.I), "source"),
    (re.compile(r"पैसेज\w*"), "स्रोत"),
    (re.compile(r"పాసేజ్\w*"), "ఆధారం"),
    (re.compile(r"\bcredit\s+bureaus\b", re.I), "credit information companies"),
    (re.compile(r"\bcredit\s+bureau\b", re.I), "credit information company"),
    (re.compile(r"\bbureaus\b", re.I), "credit information companies"),
    (re.compile(r"\bbureau\b", re.I), "credit information company"),
]


# Recorded outcome codes must never reach the borrower (E2E D-16: "ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER" and a
# bare "DECLINE" were shown). The EXPLAIN prompt forbids them; sanitize_answer() swaps any that slip through for plain
# words in the answer's language. A bare v2 short code (DECLINE, COUNTER, REFER) only counts in capitals at the end of a
# sentence or alone on a line; legacy v1 words (APPROVED/REJECTED) are left to the v1 templates.
OUTCOME_WORDS = {
    "en": {"ELIGIBILITY_CONDITIONS_MET": "Your application met our conditions.",
           "COUNTER_OFFER": "We can't offer the full amount you asked for, but we can offer a smaller loan.",
           "MANUAL_REVIEW": "A person on our team will look at your application.",
           "MORE_INFORMATION_REQUIRED": "We need a few more details from you.",
           "DECLINE": "We can't approve this application right now."},
    "hi": {"ELIGIBILITY_CONDITIONS_MET": "आपका आवेदन हमारी शर्तें पूरी करता है।",
           "COUNTER_OFFER": "हम आपकी माँगी गई पूरी राशि नहीं दे सकते, पर कम राशि का लोन दे सकते हैं।",
           "MANUAL_REVIEW": "हमारी टीम का एक व्यक्ति आपका आवेदन देखेगा।",
           "MORE_INFORMATION_REQUIRED": "हमें आपसे कुछ और जानकारी चाहिए।",
           "DECLINE": "हम अभी यह आवेदन स्वीकृत नहीं कर सकते।"},
    "te": {"ELIGIBILITY_CONDITIONS_MET": "మీ దరఖాస్తు మా షరతులను నెరవేర్చింది.",
           "COUNTER_OFFER": "మీరు అడిగిన పూర్తి మొత్తం ఇవ్వలేము, కానీ తక్కువ మొత్తంలో లోన్ ఇవ్వగలము.",
           "MANUAL_REVIEW": "మా బృందంలోని ఒక వ్యక్తి మీ దరఖాస్తును చూస్తారు.",
           "MORE_INFORMATION_REQUIRED": "మాకు మీ నుండి మరికొన్ని వివరాలు కావాలి.",
           "DECLINE": "ప్రస్తుతం ఈ దరఖాస్తును మేము ఆమోదించలేము."},
}
_ALIASES = {"COUNTER": "COUNTER_OFFER", "REJECTED": "DECLINE", "REJECT": "DECLINE", "APPROVED": "ELIGIBILITY_CONDITIONS_MET",
            "APPROVE": "ELIGIBILITY_CONDITIONS_MET", "REFER": "MANUAL_REVIEW", "REVIEW": "MANUAL_REVIEW",
            "INFO_REQUESTED": "MORE_INFORMATION_REQUIRED"}
LEAK_OUTCOME = re.compile(r"\b(ELIGIBILITY_CONDITIONS_MET|COUNTER_OFFER|MANUAL_REVIEW|MORE_INFORMATION_REQUIRED|INFO_REQUESTED)\b"
                          r"|\bDECLINE\b(?=\s*(?:[.:]|$))|^[ \t]*(?:COUNTER|REFER)[ \t]*$", re.M)


def leaked_terms(text: str) -> list[str]:
    """Internal labels / machinery words in borrower-visible text (case kept for labels, lower-cased words)."""
    found = [m.group(0) for m in LEAK_CASED.finditer(text or "")]
    found += [m.group(0).lower() for m in LEAK_WORDS.finditer(text or "")]
    found += [m.group(0) for m in LEAK_OUTCOME.finditer(text or "")]
    return sorted(set(found))


def _plain_outcome(m: re.Match, locale: str) -> str:
    code = m.group(0).strip()
    words = OUTCOME_WORDS.get(locale, OUTCOME_WORDS["en"])
    return words[_ALIASES.get(code, code)]


def sanitize_answer(text: str, locale: str = "en") -> str:
    """Strip passage labels, retrieval words and outcome codes from an answer before the borrower sees it.

    Facts, numbers and qualifiers are left untouched; only the machinery is removed or replaced by "source(s)", and an
    outcome code is replaced by plain words in `locale`. Idempotent and a no-op on clean text."""
    if not text or not leaked_terms(text):
        return text
    # "Your decision is COUNTER_OFFER." -> the plain sentence on its own (only right before a code)
    out = re.sub(r"\b(?:[Yy]our |[Tt]he )?(?:recorded )?(?:[Dd]ecision|[Oo]utcome|[Ss]tatus)(?: is| was|:)\s*(?=" + LEAK_OUTCOME.pattern + ")", "", text)
    out = LEAK_OUTCOME.sub(lambda m: _plain_outcome(m, locale), out)
    out = re.sub(r"([.!?।])\.", r"\1", out)
    for pat, rep in _SAN:
        out = pat.sub(rep, out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"[ \t]+([,.;:!?।])", r"\1", out)
    out = re.sub(r"\(\s*\)|\[\s*\]", "", out)
    # a dropped lead-in ("Based on the passages, a loan ...") leaves a sentence that must start with a capital
    out = re.sub(r"(^|[.!?।]\s+|\n\s*(?:-\s+)?)\x00([a-z])", lambda m: m.group(1) + m.group(2).upper(), out)
    out = out.replace("\x00", "")
    out = re.sub(r"(^|[.!?।]\s+|\n\s*(?:-\s+)?)(one source|both sources|the sources|sources|source)\b",
                 lambda m: m.group(1) + m.group(2)[0].upper() + m.group(2)[1:], out)
    return out.strip()


# ------------------------------------------------------------------ final output check (agent eval fix 2)
# A deterministic last check on every generated borrower answer. Any hit forces a rewrite, then the template fallback.
_OUT_CODE = re.compile(r"\b[A-Z]{2,}(?:_[A-Z0-9]{2,})+\b")                    # MIN_CREDIT_SCORE, DQ_BUREAU_NO_HIT, ...
_OUT_RULE = re.compile(r"\b(?:PL|DQ|BFL|RBI)-[A-Z]*-?\d{2,3}\b|\bPL-\d{3}\b")  # PL-047, BFL-PL-OVERVIEW#017-style ids
_OUT_MACHINE = re.compile(r"\b(?:ZEN|RAG|LLM|JDM|OCR)\b|\bsynthetic-v\d\b|\bpolicy[_ ]version\b", re.I)
_OUT_HIDDEN = re.compile(
    r"\b(settle(?:d|ment)s?|write-?offs?|written[- ]off|fraud\w*|black-?list\w*|negative[- ]list|duplicate\s+(?:application|pan|"
    r"identity)|tamper\w*|forg(?:ed|ery)|signature\s+(?:mismatch|did\s+not\s+match|didn'?t\s+match|failed))\b|"
    r"धोखाधड़ी|ब्लैकलिस्ट|सेटलमेंट|राइट-?ऑफ़?|जालसाज़ी|మోసం|బ్లాక్\s*లిస్ట్|సెటిల్మెంట్|రైట్-?ఆఫ్", re.I)
_OUT_SCORE = re.compile(r"(?:score|cibil|स्कोर|సిబిల్|స్కోర్)\D{0,20}?(?<![\d,])([3-9]\d\d)(?![\d,])|"
                        r"(?<![\d,])([3-9]\d\d)(?![\d,])\s*(?:\+\s*)?(?:credit\s+|cibil\s+)?(?:score|cibil)", re.I)


def output_violations(text: str, *, decision_turn: bool = True, own_numbers=(), limit_numbers=()) -> list[str]:
    """Kinds of internal detail in a borrower answer: outcome codes, rule ids / internal codes, passage labels and
    machinery words (all turns); on decision turns also hidden-flag words, a credit-score number that is not the
    applicant's own and any cut-off in `limit_numbers`. Empty list = clean."""
    t = text or ""
    out = [f"outcome_code:{m.group(0)}" for m in LEAK_OUTCOME.finditer(t)]
    out += [f"internal_term:{m.group(0)}" for m in _OUT_CODE.finditer(t)]
    out += [f"internal_term:{m.group(0)}" for m in _OUT_RULE.finditer(t)]
    out += [f"internal_term:{m.group(0)}" for m in _OUT_MACHINE.finditer(t)]
    out += [f"passage_label:{m.group(0)}" for m in re.finditer(rf"\b{_LBL}\b", t)]
    out += [f"passage_label:{m.group(0)}" for m in re.finditer(r"\bpassages?\b|पैसेज\w*|పాసేజ్\w*", t, re.I)]
    if decision_turn:
        if _OUT_HIDDEN.search(_strip_negated(t)) or _OUT_HIDDEN.search(t):
            out.append("hidden_flag")
        own = {str(x) for x in own_numbers or ()}
        for m in _OUT_SCORE.finditer(t):
            n = m.group(1) or m.group(2)
            if n not in own:
                out.append(f"score_value:{n}")
        lim = {str(x) for x in limit_numbers or ()}
        out += [f"limit_value:{n}" for n in numbers_in(t) if n in lim and n not in own]
    return sorted(set(out))


def citation_flags(cited: list[str], available: list[str], abstained: bool) -> list[str]:
    flags = []
    if abstained and cited:
        flags.append("citations_on_abstention")
    if not abstained and not cited:
        flags.append("answer_without_citation")
    if any(c not in available for c in cited):
        flags.append("unknown_citation_label")
    return flags
