import type { Locale } from "../types";

/*
 * Plain-language decision copy for borrowers. The record only chooses WHICH theme applies; the words come
 * from the tables below, so no number, threshold, cut-off, score or rule id from the decision ever reaches
 * a card. This mirrors apps/loan_advisory_portal/.../public/js/reasons.js word for word, and
 * plain.test.ts fails if the two drift.
 */

export const THEME_KEYS = [
  "CREDIT_HISTORY",
  "REPAYMENTS_TOO_HIGH",
  "INCOME",
  "EMPLOYMENT",
  "RECENT_APPLICATIONS",
  "DETAILS_NOT_VERIFIED",
  "DOCUMENTS",
  "REQUEST_OUTSIDE_OFFER",
  "CHECKS_PENDING",
  "OTHER",
] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
type SummaryKey = "APPROVED" | "REJECTED" | "REVIEW" | "INFO" | "ERROR";
type StepKey = Exclude<ThemeKey, "OTHER"> | "ASK" | "NEW";

export const THEMES: Record<Locale, Record<ThemeKey, string>> = {
  en: {
    CREDIT_HISTORY: "Your credit history doesn't meet our requirements right now.",
    REPAYMENTS_TOO_HIGH: "The new EMI would take too much of your monthly income.",
    INCOME: "Your income doesn't support this loan right now.",
    EMPLOYMENT: "Your time in your current job doesn't meet our requirements yet.",
    RECENT_APPLICATIONS: "There have been several recent credit applications on your profile.",
    DETAILS_NOT_VERIFIED: "We couldn't verify some details.",
    DOCUMENTS: "Some documents are missing or unclear.",
    REQUEST_OUTSIDE_OFFER: "The amount or repayment period you asked for is outside what we offer.",
    CHECKS_PENDING: "We couldn't finish one of our checks yet.",
    OTHER: "Your application didn't meet our requirements for this loan.",
  },
  hi: {
    CREDIT_HISTORY: "आपका क्रेडिट इतिहास अभी हमारी आवश्यकताओं को पूरा नहीं करता।",
    REPAYMENTS_TOO_HIGH: "नई EMI आपकी मासिक आय का बहुत बड़ा हिस्सा ले लेगी।",
    INCOME: "आपकी आय अभी इस लोन के लिए पर्याप्त नहीं है।",
    EMPLOYMENT: "आपकी मौजूदा नौकरी की अवधि अभी हमारी आवश्यकताओं को पूरा नहीं करती।",
    RECENT_APPLICATIONS: "हाल ही में आपकी प्रोफ़ाइल पर कई क्रेडिट आवेदन हुए हैं।",
    DETAILS_NOT_VERIFIED: "हम कुछ विवरणों की पुष्टि नहीं कर सके।",
    DOCUMENTS: "कुछ दस्तावेज़ अधूरे हैं या साफ़ नहीं हैं।",
    REQUEST_OUTSIDE_OFFER: "आपने जो राशि या चुकौती अवधि माँगी है, वह हमारे ऑफ़र से बाहर है।",
    CHECKS_PENDING: "हम अभी अपनी एक जाँच पूरी नहीं कर सके।",
    OTHER: "आपका आवेदन इस लोन के लिए हमारी आवश्यकताओं को पूरा नहीं करता।",
  },
  te: {
    CREDIT_HISTORY: "మీ క్రెడిట్ చరిత్ర ప్రస్తుతం మా అవసరాలకు సరిపోవడం లేదు.",
    REPAYMENTS_TOO_HIGH: "కొత్త EMI మీ నెలసరి ఆదాయంలో చాలా ఎక్కువ భాగం తీసుకుంటుంది.",
    INCOME: "మీ ఆదాయం ప్రస్తుతం ఈ లోన్‌కు సరిపోవడం లేదు.",
    EMPLOYMENT: "మీ ప్రస్తుత ఉద్యోగంలో గడిపిన కాలం ఇంకా మా అవసరాలకు సరిపోవడం లేదు.",
    RECENT_APPLICATIONS: "ఇటీవల మీ ప్రొఫైల్‌పై చాలా క్రెడిట్ దరఖాస్తులు ఉన్నాయి.",
    DETAILS_NOT_VERIFIED: "మేము కొన్ని వివరాలను ధృవీకరించలేకపోయాము.",
    DOCUMENTS: "కొన్ని పత్రాలు లేవు లేదా స్పష్టంగా లేవు.",
    REQUEST_OUTSIDE_OFFER: "మీరు అడిగిన మొత్తం లేదా తిరిగి చెల్లింపు కాలం మేము అందించే పరిధికి వెలుపల ఉంది.",
    CHECKS_PENDING: "మేము మా తనిఖీలలో ఒకదాన్ని ఇంకా పూర్తి చేయలేకపోయాము.",
    OTHER: "మీ దరఖాస్తు ఈ లోన్‌కు మా అవసరాలకు సరిపోలేదు.",
  },
};

export const SUMMARIES: Record<Locale, Record<SummaryKey, string>> = {
  en: {
    APPROVED: "Good news: your application was approved. Your loan details are below.",
    REJECTED: "We can't approve this application right now. These are the main things that held it back.",
    REVIEW: "Your application needs a closer look from our team. You don't need to do anything unless we contact you.",
    INFO: "We need a few details from you before we can finish checking your application.",
    ERROR: "We couldn't finish checking your application yet. It stays open, and you don't need to do anything right now.",
  },
  hi: {
    APPROVED: "अच्छी ख़बर: आपका आवेदन स्वीकृत हो गया है। आपके लोन का विवरण नीचे है।",
    REJECTED: "हम अभी यह आवेदन स्वीकृत नहीं कर सकते। इसके मुख्य कारण ये हैं।",
    REVIEW: "हमारी टीम आपके आवेदन को ध्यान से देख रही है। जब तक हम संपर्क न करें, आपको कुछ करने की ज़रूरत नहीं है।",
    INFO: "आपके आवेदन की जाँच पूरी करने से पहले हमें आपसे कुछ जानकारी चाहिए।",
    ERROR: "हम अभी आपके आवेदन की जाँच पूरी नहीं कर सके। आवेदन खुला रहेगा, अभी आपको कुछ करने की ज़रूरत नहीं है।",
  },
  te: {
    APPROVED: "శుభవార్త: మీ దరఖాస్తు ఆమోదించబడింది. మీ లోన్ వివరాలు క్రింద ఉన్నాయి.",
    REJECTED: "ప్రస్తుతం ఈ దరఖాస్తును మేము ఆమోదించలేము. దీనికి ప్రధాన కారణాలు ఇవి.",
    REVIEW: "మీ దరఖాస్తును మా బృందం జాగ్రత్తగా పరిశీలిస్తోంది. మేము సంప్రదించే వరకు మీరు ఏమీ చేయనవసరం లేదు.",
    INFO: "మీ దరఖాస్తు తనిఖీ పూర్తి చేయడానికి ముందు మాకు మీ నుండి కొన్ని వివరాలు కావాలి.",
    ERROR: "మేము ఇంకా మీ దరఖాస్తు తనిఖీ పూర్తి చేయలేకపోయాము. దరఖాస్తు తెరిచే ఉంటుంది, ప్రస్తుతం మీరు ఏమీ చేయనవసరం లేదు.",
  },
};

export const STEPS: Record<Locale, Record<StepKey, string>> = {
  en: {
    CREDIT_HISTORY: "Pay every EMI and card bill on time, and keep your card balances low.",
    REPAYMENTS_TOO_HIGH: "Try a smaller amount or a longer repayment period, or close a small loan first.",
    INCOME: "Make sure your full income shows in your documents, such as recent salary slips.",
    EMPLOYMENT: "Give it a little more time in your current job before you apply again.",
    RECENT_APPLICATIONS: "Avoid applying for other loans or credit cards for a while.",
    DETAILS_NOT_VERIFIED: "Check that your name and date of birth match on all your documents.",
    DOCUMENTS: "Upload clear, recent copies of the documents we asked for.",
    REQUEST_OUTSIDE_OFFER: "Choose an amount and repayment period within what we offer.",
    CHECKS_PENDING: "Nothing is needed from you now. We'll contact you if we need anything.",
    ASK: "Ask our team what would help before you apply again.",
    NEW: "You can start a new application when your circumstances change.",
  },
  hi: {
    CREDIT_HISTORY: "हर EMI और कार्ड बिल समय पर चुकाएँ, और कार्ड पर बकाया कम रखें।",
    REPAYMENTS_TOO_HIGH: "कम राशि या लंबी चुकौती अवधि चुनें, या पहले कोई छोटा लोन बंद करें।",
    INCOME: "ध्यान दें कि आपकी पूरी आय आपके दस्तावेज़ों में दिखे, जैसे हाल की सैलरी स्लिप।",
    EMPLOYMENT: "दोबारा आवेदन करने से पहले अपनी मौजूदा नौकरी में थोड़ा और समय दें।",
    RECENT_APPLICATIONS: "कुछ समय तक दूसरे लोन या क्रेडिट कार्ड के लिए आवेदन न करें।",
    DETAILS_NOT_VERIFIED: "जाँच लें कि आपका नाम और जन्मतिथि सभी दस्तावेज़ों में एक जैसे हों।",
    DOCUMENTS: "माँगे गए दस्तावेज़ों की साफ़ और हाल की कॉपी अपलोड करें।",
    REQUEST_OUTSIDE_OFFER: "हमारे ऑफ़र के भीतर की राशि और चुकौती अवधि चुनें।",
    CHECKS_PENDING: "अभी आपको कुछ नहीं करना है। ज़रूरत होने पर हम आपसे संपर्क करेंगे।",
    ASK: "दोबारा आवेदन करने से पहले हमारी टीम से पूछें कि क्या मदद करेगा।",
    NEW: "परिस्थितियाँ बदलने पर आप नया आवेदन शुरू कर सकते हैं।",
  },
  te: {
    CREDIT_HISTORY: "ప్రతి EMI, కార్డ్ బిల్లును సమయానికి చెల్లించండి, కార్డ్ బకాయిలు తక్కువగా ఉంచండి.",
    REPAYMENTS_TOO_HIGH: "తక్కువ మొత్తం లేదా ఎక్కువ తిరిగి చెల్లింపు కాలం ఎంచుకోండి, లేదా ముందుగా ఒక చిన్న లోన్ మూసివేయండి.",
    INCOME: "మీ పూర్తి ఆదాయం మీ పత్రాల్లో, ఉదాహరణకు ఇటీవలి జీతం స్లిప్పుల్లో, కనిపించేలా చూసుకోండి.",
    EMPLOYMENT: "మళ్లీ దరఖాస్తు చేసే ముందు మీ ప్రస్తుత ఉద్యోగంలో ఇంకొంత కాలం కొనసాగండి.",
    RECENT_APPLICATIONS: "కొంతకాలం ఇతర లోన్లు లేదా క్రెడిట్ కార్డుల కోసం దరఖాస్తు చేయకండి.",
    DETAILS_NOT_VERIFIED: "మీ పేరు, పుట్టిన తేదీ అన్ని పత్రాల్లో ఒకేలా ఉన్నాయో లేదో చూసుకోండి.",
    DOCUMENTS: "మేము అడిగిన పత్రాల స్పష్టమైన, ఇటీవలి కాపీలను అప్‌లోడ్ చేయండి.",
    REQUEST_OUTSIDE_OFFER: "మేము అందించే పరిధిలో ఉన్న మొత్తం, తిరిగి చెల్లింపు కాలాన్ని ఎంచుకోండి.",
    CHECKS_PENDING: "ప్రస్తుతం మీరు ఏమీ చేయనవసరం లేదు. అవసరమైతే మేమే మిమ్మల్ని సంప్రదిస్తాము.",
    ASK: "మళ్లీ దరఖాస్తు చేసే ముందు ఏది సహాయపడుతుందో మా బృందాన్ని అడగండి.",
    NEW: "మీ పరిస్థితులు మారినప్పుడు కొత్త దరఖాస్తు ప్రారంభించవచ్చు.",
  },
};

/** What-if wording (owner decision: "would likely meet" / "wouldn't meet", never a cut-off). */
export const WHAT_IF: Record<Locale, { meet: string; miss: string; label: string; error: string }> = {
  en: {
    meet: "With these numbers, you would likely meet our checks.",
    miss: "With these numbers, you wouldn't meet our checks.",
    label: "Estimate only, your application is unchanged",
    error: "We couldn't work out that estimate. Try different numbers, or ask your question in words.",
  },
  hi: {
    meet: "इन आँकड़ों के साथ आप शायद हमारी जाँच पूरी कर लेंगे।",
    miss: "इन आँकड़ों के साथ आप हमारी जाँच पूरी नहीं कर पाएँगे।",
    label: "केवल अनुमान, आपका आवेदन नहीं बदला है",
    error: "हम यह अनुमान नहीं निकाल सके। दूसरे आँकड़े आज़माएँ, या अपना सवाल शब्दों में पूछें।",
  },
  te: {
    meet: "ఈ సంఖ్యలతో మీరు మా తనిఖీలను బహుశా అందుకుంటారు.",
    miss: "ఈ సంఖ్యలతో మీరు మా తనిఖీలను అందుకోలేరు.",
    label: "అంచనా మాత్రమే, మీ దరఖాస్తు మారలేదు",
    error: "మేము ఆ అంచనాను లెక్కించలేకపోయాము. వేరే సంఖ్యలు ప్రయత్నించండి, లేదా మీ ప్రశ్నను మాటల్లో అడగండి.",
  },
};

const CATEGORY: Record<string, ThemeKey> = {
  CREDIT_HISTORY: "CREDIT_HISTORY",
  REPAYMENTS_TOO_HIGH: "REPAYMENTS_TOO_HIGH",
  INCOME_NOT_VERIFIED_OR_INSUFFICIENT: "INCOME",
  INCOME: "INCOME",
  EMPLOYMENT_STABILITY: "EMPLOYMENT",
  EMPLOYMENT: "EMPLOYMENT",
  RECENT_CREDIT_APPLICATIONS: "RECENT_APPLICATIONS",
  RECENT_APPLICATIONS: "RECENT_APPLICATIONS",
  DETAILS_NOT_VERIFIED: "DETAILS_NOT_VERIFIED",
  DOCUMENTS_INCOMPLETE_OR_UNCLEAR: "DOCUMENTS",
  DOCUMENTS: "DOCUMENTS",
  REQUEST_OUTSIDE_OFFER: "REQUEST_OUTSIDE_OFFER",
  CHECKS_PENDING: "CHECKS_PENDING",
  OTHER: "OTHER",
};

/* Same order as the portal: sensitive and processing signals win. */
const PATTERNS: [ThemeKey, RegExp][] = [
  ["DETAILS_NOT_VERIFIED", /fraud|tamper|duplicat|negative|signature|identity|mismatch|verif|kyc|\bpan\b|aadhaar|caution|suspicious|unusual|integrity/i],
  ["CHECKS_PENDING", /provider|timeout|time out|unavailable|not available|outage|pending/i],
  ["DOCUMENTS", /\bdocs?\b|document|unclear|illegible/i],
  ["REPAYMENTS_TOO_HIGH", /foir|\bemis?\b|obligation|repay|debt|\bdti\b|afford/i],
  ["RECENT_APPLICATIONS", /enquir|inquir|recent (credit )?appl|applications? recently/i],
  ["CREDIT_HISTORY", /credit|cibil|score|bureau|\bdpd\b|write ?off|settle|default|overdue|delinquen/i],
  ["EMPLOYMENT", /employ|\bjob\b|probation|work ?ex/i],
  ["INCOME", /income|salary/i],
  ["REQUEST_OUTSIDE_OFFER", /amount|tenure|purpose|outside|product|loan limit|counter/i],
];

function match(text: string): ThemeKey | null {
  if (!text.trim()) return null;
  for (const [key, pattern] of PATTERNS) if (pattern.test(text)) return key;
  return null;
}

function words(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ").replace(/[_-]+/g, " ");
}

export interface ReasonSignal {
  category?: string | null;
  code?: string | null;
  reason_code?: string | null;
  rule_id?: string | null;
  name?: string | null;
  text?: string | null;
}

/** Which theme one reason belongs to: explicit category, then its code, then its words. */
export function classify(reason: ReasonSignal | string): ThemeKey {
  const value: ReasonSignal = typeof reason === "string" ? { code: reason } : reason;
  const category = CATEGORY[String(value.category ?? "").toUpperCase()];
  if (category) return category;
  return match(words([value.code, value.reason_code, value.rule_id])) ?? match(words([value.name, value.text])) ?? "OTHER";
}

/** Distinct themes in first-seen order, at most three; the generic one drops out beside a specific one. */
export function reasonThemes(reasons: (ReasonSignal | string)[], max = 3): ThemeKey[] {
  let seen: ThemeKey[] = [];
  for (const reason of reasons) {
    const key = classify(reason);
    if (!seen.includes(key)) seen.push(key);
  }
  if (seen.length > 1) seen = seen.filter((key) => key !== "OTHER");
  return seen.slice(0, max);
}

export function lang(locale: string | null | undefined): Locale {
  return locale === "hi" || locale === "te" ? locale : "en";
}

export function themeText(key: ThemeKey, locale?: string | null): string {
  return THEMES[lang(locale)][key] ?? THEMES[lang(locale)].OTHER;
}

const OUTCOME: Record<string, SummaryKey> = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVIEW: "REVIEW",
  MANUAL_REVIEW: "REVIEW",
  INFO_REQUESTED: "INFO",
  INFO: "INFO",
  ERROR: "ERROR",
};

export function decisionSummary(outcome: string | null | undefined, locale?: string | null): string | null {
  const key = OUTCOME[String(outcome ?? "").toUpperCase()];
  return key ? SUMMARIES[lang(locale)][key] : null;
}

/** Two or three general steps for the given themes, never a target or a gap. */
export function improvementSteps(themes: ThemeKey[], locale?: string | null): string[] {
  const table = STEPS[lang(locale)];
  const out: string[] = [];
  for (const key of themes) {
    const text = key === "OTHER" ? undefined : table[key];
    if (text && !out.includes(text)) out.push(text);
  }
  const steps = out.slice(0, 3);
  for (const text of [table.ASK, table.NEW]) if (steps.length < 2 && !steps.includes(text)) steps.push(text);
  return steps;
}

/** Words that must never reach borrower decision text. */
export const FORBIDDEN = /cibil|foir|threshold|cut-?off|\bPL-|score/i;

/** Server text is shown only when it carries no digit and none of the forbidden words. */
export function safeText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || /\d/.test(text) || FORBIDDEN.test(text)) return null;
  return text;
}

/** "would likely meet" only for an approval-like estimate; anything else is "wouldn't meet". */
export function whatIfMeets(result: string | null | undefined): boolean | null {
  if (!result) return null;
  const value = result.toUpperCase();
  return value === "APPROVED" || value === "WOULD_LIKELY_MEET" || value === "MEET";
}
