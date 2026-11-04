"""Route first: deterministic pre-routing of a turn before any tool runs (agent eval fixes 1, 3 and 6).

A router proposes ONE intent for the applicant's latest message, or None when it is not sure. The graph asks the
routers in order and falls back to the LLM classifier (then its regex rules) only when none is sure, so obvious
turns in any language never wait on a slow classifier, and a turn that needs no decision never fetches it.

    Router.route(message, locale, context) -> RouteResult | None

`KeywordRouter` is the built-in high-precision router (English, Hindi, Telugu, romanised Hindi/Telugu).
`LayaRouterAdapter` is the plug-in point for the Laya System-1 router; it is not wired (measured 2026-11-04: no gain,
+0.85 s per turn). Any error or low confidence from an adapter means "not sure".

Graph intents a router may return:
  explain, status, improve, what_if, policy, greeting, other, vague, human_review, distress, misrepresentation,
  bureau_request, other_applicant, injection
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Protocol

ROUTABLE = ("explain", "status", "improve", "what_if", "policy", "greeting", "other", "vague", "human_review",
            "distress", "misrepresentation", "bureau_request", "other_applicant", "injection")


@dataclass
class RouteResult:
    intent: str
    confidence: float = 1.0
    source: str = "keyword"
    flags: dict = field(default_factory=dict)  # e.g. {"distress": True} on a human_review turn


class Router(Protocol):
    name: str

    def route(self, message: str, locale: str = "en", context: str = "") -> RouteResult | None: ...


# ------------------------------------------------------------------ keyword / script patterns
_HOWTO = re.compile(r"\b(how\s+(do|can|could|should|would)\s+(i|we|one)|how\s+to|what\s+is\s+the\s+(process|procedure)|"
                    r"process\s+(for|to)|procedure|ombudsman|grievance\s+officer|complain\w*)\b", re.I)

_HUMAN = re.compile(
    r"\b(speak|talk|chat)\s+(to|with)\s+(a\s+|an\s+|some\s+|the\s+)?(real\s+)?(human|person|agent|someone|somebody|officer|"
    r"manager|executive|representative|people)\b|"
    r"\b(human|manual|personal|someone's)\s+(review|check|look)\b|"
    r"\b(can|could|would|will)\s+(a|some|any)\s?(one|body|person|human)\s+(please\s+)?(look|check|recheck|review|call|see)\b|"
    r"\b(get|have|ask|need|want)\s+(someone|somebody|a\s+person|a\s+human|a\s+reviewer|an?\s+officer)\b.{0,20}"
    r"\b(to\s+)?(look|check|recheck|review|call|see|help)\b|"
    r"\b(have|get|ask)\s+(a\s+person|someone|somebody)\s+(to\s+)?call\s+me\b|"
    r"^\W*(ok(ay)?|fine|yes|yeah|please)?[\s,.!]*(please\s+)?(escalate|recheck)(\s+(it|this|my\s+(case|application)))?\W*$|"
    r"\bescalate\s+(it|this|my\s+(case|application|file))\b|\b(re-?check|re-?review)\s+(it|this|my\s+(case|application))\b|"
    r"किसी\s+(इंसान|व्यक्ति|आदमी|अधिकारी)\s+से\s+बात|किसी\s+से\s+बात\s+(करवा|करा)|इंसान\s+से\s+बात|"
    r"(मानव|व्यक्तिगत)\s+समीक्षा|दोबारा\s+(जाँच|जांच)\s+(करवा|करा|कीजिए|करें)|"
    r"\b(kisi\s+(insaan|insan|vyakti|aadmi)\s+se|kisi\s+se)\s+baat\b|\bbaat\s+karwa|"
    r"(మనిషి|వ్యక్తి|అధికారి)\s*(తో|తోటి)\s+మాట్లాడ|ఎవరితోనైనా\s+మాట్లాడ|మళ్ళీ\s+(పరిశీలించ|చెక్\s+చేయ)|"
    r"\b(manishi|vyakti|evarainaa?)\s*(tho|to)\s+matlad", re.I)

_DISTRESS = re.compile(
    r"\b(icu|i\.c\.u|intensive care|hospitali[sz]ed|in (the )?hospital|surgery|dying|suicid\w*|desperate|devastated|"
    r"depressed|panick?(ing|ed)?|terrified|scared|crying|heartbroken|helpless|humiliat\w*|how dare|heartless|"
    r"what kind of (company|people)|ruin(ed|ing) my|i'?m not a (cheat|fraud|liar|thief)|not a cheat)\b|"
    r"\bmy\s+(child|son|daughter|baby|husband|wife|mother|father|mom|mum|dad|kid)\b.{0,20}\b(is\s+)?(sick|ill|unwell|in\s+(the\s+)?"
    r"(icu|hospital))\b|"
    r"\bare\s+you\s+(saying|calling|accusing)\b.{0,40}\b(fake|fraud|cheat|liar|forged|lying)\b|"
    r"बहुत\s+बुरा\s+लग|परेशान\s+(हूँ|हूं|हो\s+गया|हो\s+गई)|डर\s+लग|रो\s+(रहा|रही)|अस्पताल|आईसीयू|धोखेबाज़?\s+नहीं|"
    r"\bbahut\s+bura\s+lag|\bpareshan\b|"
    r"చాలా\s+బాధ|భయంగా|ఆసుపత్రి|ఏడుస్తున్న|\bchala\s+badha", re.I)

_MISREP = re.compile(
    r"\b(put|write|enter|show|say|record|list|mark|fill|use|give)\b.{0,30}\b(my\s+)?(old|previous|former|ex-?)\s+"
    r"(company|employer|job)(?:'s)?\b.{0,30}\b(joining\s+date|date|salary|instead)|"
    r"\b(record|write|put|list|mark|enter|change|show)\s+(it|the\s+purpose|my\s+purpose|purpose|me|myself)\s+as\s+"
    r"(salaried|home\s+renovation|wedding|medical|education|higher\s+education|employed)\b|"
    r"\b(say|write|put|show|tell\s+them)\s+(that\s+)?i('?m|\s+am)\s+(salaried|employed)\b.{0,30}\b(instead|even\s+though|though)\b|"
    r"\b(salaried|naukri|job)\s+(likh|daal|bata)\s*(deta|du|doon|dun|dete|dijiye|do)\b|"
    r"(सैलरीड|नौकरी|उद्देश्य).{0,15}(लिख|डाल)\s*(देता|दूँ|दूं|दो|दीजिए)|"
    r"(జీతం|సాలరీడ్|ఉద్యోగం).{0,15}(రాసేయ|రాయండి|వేసేయ)", re.I)

_BUREAU = re.compile(
    r"\b(pull|fetch|re-?run|run|start|do|get|refresh|re-?check)\b.{0,20}\b(my\s+)?(cibil|credit\s+(check|report|score|pull)|"
    r"bureau(\s+(check|report))?)\b.{0,25}\b(again|now|right\s+now|fresh|new|today|once\s+more)\b|"
    r"\b(fresh|new)\s+(credit|cibil)\s+(check|pull|report)\b|\bpull\s+my\s+(cibil|credit)\b|"
    r"(सिबिल|क्रेडिट\s+रिपोर्ट).{0,20}(फिर\s+से|दोबारा)\s+(निकाल|चेक|देख)|"
    r"(సిబిల్|క్రెడిట్\s+రిపోర్ట్).{0,20}మళ్ళీ\s+(తీయ|చెక్)", re.I)

_STATUS = re.compile(
    r"\b(application|loan)\s+status\b|\bstatus\s+of\s+my\s+(application|loan)\b|\bwhat'?s\s+my\s+status\b|"
    r"\bwhere\s+is\s+my\s+(application|loan)\b|"
    r"(आवेदन|लोन)\s+(की\s+)?(स्थिति|स्टेटस)|(దరఖాస్తు|లోన్)\s+(స్థితి|స్టేటస్)", re.I)

_ACK = (r"(hi|hello|hey|namaste|namaskar|namaskaram|thanks?|thank\s+you( so much| very much)?|thx|ty|ok(ay)?|got\s+it|"
        r"understood|noted|great|cool|alright|fine|shukriya|dhanyavaad|dhanyavad|sare|sari|"
        r"धन्यवाद|शुक्रिया|नमस्ते|ठीक\s+है|ధన్యవాదాలు|థాంక్స్|నమస్కారం|సరే)")
_THANKS = re.compile(
    rf"^\W*{_ACK}([\s,.!]+{_ACK})*(\s+(a\s+lot|so\s+much|again|ji|jee|andi|for\s+(explaining|the\s+help|your\s+help|that|"
    r"the\s+information|clarifying)))?\W*$", re.I)
_OTHER_PERSON = re.compile(
    r"\b(my\s+)?(friend|brother|sister|cousin|colleague|neighbou?r|dost|bhai|behen|didi)\b.{0,40}\b(loan|application|status|"
    r"score|cibil)\b.{0,40}\b(status|tell|cheppa\w*|batao|bataiye|show|check|what)|"
    r"\b(vaadi|vaadu|aame|aavida|uska|uski|unka|unki)\s+(loan|application|status|score)\b|"
    r"(दोस्त|भाई|बहन)\s+(का|की)\s+(लोन|आवेदन|स्टेटस)|(స్నేహితుడి|అన్న|తమ్ముడి|చెల్లెలి)\s+(లోన్|దరఖాస్తు)", re.I)

# Probes for cut-offs / hidden flags about the applicant's OWN case: answered from the recorded decision (explain),
# never from policy passages with published numbers (golden leak probes, AC-013 "what score do I need? 650?").
_LEAK_PROBE = re.compile(
    r"\b(score|months?|income|salary|ratio|percentage|cibil|credit\s+history|experience)\b.{0,30}\b(do|would|will|should)\s+i\s+need\b|"
    r"\b(how\s+much|what)\s+(credit\s+|cibil\s+)?(score|income|salary)\b.{0,20}\bi\s+need\b|"
    r"\b(just|exactly|exact)\b.{0,30}\b(number|score|limit|cut-?off|ratio|percentage|months|rule)\b|"
    r"\bgive\s+me\s+the\s+(number|limit|cut-?off|exact)\b|\bwhat\s+(ratio|percentage|cut-?off|threshold|limit)\b|"
    r"\bhow\s+many\b.{0,40}\b(too\s+many|before|exactly)\b|"
    r"\bwhich\s+(detail|document|account|rule|check)\b.{0,30}\b(didn'?t|did\s+not|not)\s+(match|pass|meet)\b|"
    r"\b(because\s+of\s+fraud|am\s+i\s+(blacklisted|on\s+a\s+(black|negative)\s*list))\b|"
    r"\bsignature\b.{0,20}\b(not\s+match|mismatch|didn'?t\s+match)\b|\bwhat\s+score\s+did\s+it\s+get\b|"
    r"\bshow\s+me\s+the\s+calculation\b|\bexact\s+rule\b|\bwhy\s+is\s+my\s+report\s+not\s+valid\b|"
    r"ब्लैकलिस्ट|धोखेबाज़\s+समझ|सीमा\s+कितनी|कितनी\s+EMI\s+तक|ఎన్ని\s+నెలలు|కచ్చితంగా\s+చెప్ప", re.I)

# Vague: a short follow-up that names a topic but not which thing ("ok and what about the charges", "fees?").
_VAGUE_TOPIC = re.compile(r"\b(charges?|fees?|rates?|interest|documents?|papers|timeline|time|process|terms)\b|"
                          r"शुल्क|चार्ज|फीस|दस्तावेज़|ఛార్జీలు|ఫీజు|పత్రాలు", re.I)
_VAGUE_SPECIFIC = re.compile(r"\b(processing|foreclos\w*|prepay\w*|part[- ]?pay\w*|late|bounce|penal|stamp|kfs|"
                             r"key fact|cooling|gst|annual|which|for (a|the|my) (loan|wedding|education|renovation|medical)|"
                             r"salary slip|bank statement|pan|aadhaar|itr|form 16|how (much|long)|what is the|rbi|bajaj)\b", re.I)
_VAGUE_LEAD = re.compile(r"^\W*((ok(ay)?|and|so|also|then|what about|how about|tell me about|and what about|aur|toh|to|"
                         r"kya|सर|और|तो|अच्छा|మరి|సరే|ఇంకా)\b[\s,]*)+", re.I)
_VAGUE_STOP = {"the", "a", "an", "about", "what", "for", "it", "on", "of", "this", "that", "loan", "me", "please", "ke", "ka",
               "ki", "baare", "mein", "के", "बारे", "में", "का", "की", "గురించి"}

# Decision questions in Hindi / Telugu (script and romanised): "why was my loan rejected", "what happened".
_EXPLAIN_INDIC = re.compile(
    r"(क्यों|क्यूं).{0,40}(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज|मना|reject)|"
    r"(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज).{0,40}(क्यों|क्यूं)|"
    r"(मेरे|मेरा)\s+(लोन|आवेदन).{0,30}(क्या\s+हुआ|फ़ैसला|फैसला|नतीजा|मंज़ूर|मंजूर)|"
    r"\b(kyun|kyon)\b.{0,40}\b(reject|cancel|mana|decline)|\b(reject|decline)\w*\b.{0,30}\b(kyun|kyon)\b|"
    r"\bmera\s+(loan|application)\b.{0,30}\b(kya\s+hua|reject|approve|manjoor)\b|"
    r"ఎందుకు.{0,40}(తిరస్కర|రిజెక్ట్|reject)|(తిరస్కర|రిజెక్ట్).{0,40}ఎందుకు|"
    r"నా\s+(లోన్|దరఖాస్తు).{0,30}(ఏమైంది|నిర్ణయం|ఆమోద|మంజూరు)|"
    r"\b(enduku)\b.{0,40}\b(reject|thiraskar)|\bnaa\s+(loan|application)\b.{0,30}\b(emaindi|reject|approve)\b", re.I)


def _is_vague(message: str) -> bool:
    m = message.strip()
    if len(m.split()) > 7 or not _VAGUE_TOPIC.search(m) or _VAGUE_SPECIFIC.search(m):
        return False
    rest = _VAGUE_LEAD.sub("", m)
    # "the charges?" / "and the fees" / "what about documents" — nothing beyond the bare topic
    words = [w for w in re.sub(r"[?!.,;:।'\"()]", " ", rest).split() if w.lower() not in _VAGUE_STOP]
    return len(words) <= 1


class KeywordRouter:
    """High-precision patterns only: a hit is a route; anything else returns None (ask the classifier)."""
    name = "keyword"

    def route(self, message: str, locale: str = "en", context: str = "") -> RouteResult | None:
        msg = message or ""
        howto = bool(_HOWTO.search(msg))
        distress = bool(_DISTRESS.search(msg))
        if _MISREP.search(msg):
            return RouteResult("misrepresentation")
        if _HUMAN.search(msg) and not howto:
            return RouteResult("human_review", flags={"distress": distress})
        if _BUREAU.search(msg) and not howto:
            return RouteResult("bureau_request")
        if distress:
            return RouteResult("distress")
        if _THANKS.match(msg):
            return RouteResult("greeting")
        if _OTHER_PERSON.search(msg):
            return RouteResult("other_applicant")
        if _STATUS.search(msg) and not howto:
            return RouteResult("status")
        if _LEAK_PROBE.search(msg) and not howto:
            return RouteResult("explain", flags={"leak_probe": True})
        if _is_vague(msg):
            return RouteResult("vague")
        if locale in ("hi", "te") or re.search(r"[\u0900-\u097F\u0C00-\u0C7F]", msg):
            if _EXPLAIN_INDIC.search(msg) and not re.search(r"\d", msg):
                return RouteResult("explain")
        return None


# ------------------------------------------------------------------ Laya System-1 router (optional, behind a flag)
LAYA_INTENT_MAP = {  # Laya question keys (laya_questions.INTENTS) -> graph intents
    "explain_decision": "explain", "application_status": "status", "what_if": "what_if", "improve": "improve",
    "policy_question": "policy", "vague": "vague", "human_review": "human_review", "distress": "distress",
    "misrepresentation": "misrepresentation", "other_applicant": "other_applicant", "injection": "injection",
    "off_topic": "other", "greeting": "greeting",
}


class LayaRouterAdapter:
    """Wraps a Laya client exposing `route(text, lang=..., context=...) -> {"intent", "confidence", "flags"}` (or an
    object with those attributes). Below `min_confidence`, unknown intents and any error return None."""
    name = "laya"

    def __init__(self, client, min_confidence: float = 0.6):
        self.client, self.min_confidence = client, min_confidence

    def route(self, message: str, locale: str = "en", context: str = "") -> RouteResult | None:
        try:
            out = self.client.route(message, lang=locale, context=context)
        except Exception:  # the router is an optimisation; it must never break a turn
            return None
        if out is None:
            return None
        get = out.get if isinstance(out, dict) else (lambda k, d=None: getattr(out, k, d))
        intent = LAYA_INTENT_MAP.get(get("intent"))
        conf = get("confidence")
        try:
            conf = float(conf) if conf is not None else 0.0
        except (TypeError, ValueError):
            conf = 0.0
        if intent is None or conf < self.min_confidence:
            return None
        flags = get("flags") or {}
        return RouteResult(intent, conf, "laya", flags=dict(flags) if isinstance(flags, dict) else {})


def build_routers(env=None) -> list:
    """The keyword router only. The Laya System-1 router was measured and NOT adopted (2026-11-04: untuned hybrid
    80.0% vs 79.3% keyword-only, +0.85 s per turn), so nothing builds it here; `LayaRouterAdapter` stays as the
    documented plug-in point if a tuned model is evaluated later."""
    del env
    return [KeywordRouter()]


def first_route(routers, message: str, locale: str = "en", context: str = "") -> RouteResult | None:
    for r in routers or []:
        res = r.route(message, locale, context)
        if res is not None and res.intent in ROUTABLE:
            return res
    return None


__all__ = ["RouteResult", "Router", "KeywordRouter", "LayaRouterAdapter", "LAYA_INTENT_MAP", "build_routers",
           "first_route", "ROUTABLE"]
