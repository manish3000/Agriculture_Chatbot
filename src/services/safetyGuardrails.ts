/**
 * Safety Guardrails Engine
 * Protects farmers from harmful advice and the system from misuse.
 *
 * Checks:
 * 1. Out-of-domain refusal (non-agriculture topics)
 * 2. Hazardous / banned chemicals detection + safety advisory
 * 3. Prompt injection / jailbreak neutralization
 * 4. PII redaction (Aadhaar, bank account numbers)
 * 5. Profanity / abusive content handling
 */

import type { DetectedLanguage } from "./languageDetector";

// ─── Guardrail Result ─────────────────────────────────────────────────────────

export type GuardrailAction =
  | "pass"              // Query is safe, continue processing
  | "block"             // Query is blocked, return guardrail response
  | "warn"              // Query triggers a warning but can proceed with advisory
  | "redact";           // Query contained PII, redacted text is returned

export interface GuardrailResult {
  action: GuardrailAction;
  safeQuery?: string;       // PII-redacted version of the query (for redact action)
  response?: string;        // Pre-formulated response to return to user
  reason?: string;          // Internal reason code for logging
}

// ─── 1. OUT-OF-DOMAIN TOPICS ─────────────────────────────────────────────────

const OUT_OF_DOMAIN_PATTERNS: RegExp[] = [
  // Politics & government beyond agriculture
  /\b(politics|political party|election|vote|bjp|congress|aap|modi|pm narendra|rahul gandhi)\b/i,
  // Entertainment / movies
  /\b(movie|film|actor|actress|bollywood|cricket|ipl|match|serial|web series)\b/i,
  // Technology / coding / software
  /\b(code|programming|javascript|python|java|html|css|software|app development|machine learning|ai model)\b/i,
  // Finance / stock market (non-agriculture)
  /\b(stock market|sensex|nifty|share price|mutual fund|cryptocurrency|bitcoin|trading)\b/i,
  // Medical advice (non-emergency)
  /\b(doctor|hospital|medicine|disease treatment|tablet|injection|dosage|health advice)\b/i,
  // Religion / caste
  /\b(religion|caste|temple|mosque|church|hindu|muslim|christian|brahmin|dalit)\b/i,
  // Legal advice
  /\b(lawyer|advocate|court|lawsuit|legal advice|ipc section|fir)\b/i,
];

// ─── 2. HAZARDOUS / BANNED CHEMICALS ────────────────────────────────────────

interface HazardousChemical {
  names: string[];
  isBanned: boolean;
  riskLevel: "high" | "extreme";
}

const HAZARDOUS_CHEMICALS: HazardousChemical[] = [
  {
    names: ["endosulfan", "एंडोसल्फान"],
    isBanned: true,
    riskLevel: "extreme",
  },
  {
    names: ["paraquat", "पैराक्वाट"],
    isBanned: true,
    riskLevel: "extreme",
  },
  {
    names: ["monocrotophos", "मोनोक्रोटोफास"],
    isBanned: false,
    riskLevel: "high",
  },
  {
    names: ["aluminum phosphide", "aluminium phosphide", "celphos", "सेल्फोस", "फ्यूमिगेशन"],
    isBanned: false,
    riskLevel: "extreme",
  },
  {
    names: ["methyl bromide", "मिथाइल ब्रोमाइड"],
    isBanned: true,
    riskLevel: "extreme",
  },
  {
    names: ["chlorpyrifos", "क्लोरपायरीफॉस"],
    isBanned: false,
    riskLevel: "high",
  },
  {
    names: ["ddt", "डीडीटी"],
    isBanned: true,
    riskLevel: "extreme",
  },
  {
    names: ["2,4,5-t", "herbicide mix"],
    isBanned: true,
    riskLevel: "high",
  },
];

// ─── 3. PROMPT INJECTION PATTERNS ────────────────────────────────────────────

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|prior|above|all)\s+(instructions?|rules?|prompt|system)/i,
  /\b(jailbreak|dan mode|act as|pretend to be|you are now|forget you are)\b/i,
  /\b(system prompt|reveal prompt|show instructions|print instructions)\b/i,
  /\b(override|bypass|disable|remove)\s+(filter|guardrail|safety|restriction)/i,
  /\b(write me a|generate|create)\s+(malware|virus|hack|exploit|bomb)\b/i,
  /do\s+anything\s+now/i,
  /\[\s*(system|assistant|user)\s*\]/i,
];

// ─── 4. PII PATTERNS ─────────────────────────────────────────────────────────

const PII_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Aadhaar number: 12 digits (with optional spaces/dashes)
  {
    pattern: /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/g,
    replacement: "XXXX-XXXX-XXXX",
  },
  // Bank account: 9–18 digit numbers
  {
    pattern: /\b(\d{9,18})\b/g,
    replacement: "[Account No. Redacted]",
  },
  // Mobile numbers starting with 6-9
  {
    pattern: /\b([6-9]\d{9})\b/g,
    replacement: "[Phone No. Redacted]",
  },
];

// ─── 5. PROFANITY / ABUSE ────────────────────────────────────────────────────

const ABUSIVE_PATTERNS: RegExp[] = [
  /\b(bastard|madarchod|bhenchod|sala|saala|gaali|chutiya|harami)\b/i,
  /\b(stupid|idiot|dumb|useless)\s+(system|bot|ai|chatbot)\b/i,
];

// ─── Response Templates ───────────────────────────────────────────────────────

function getOutOfDomainResponse(lang: DetectedLanguage): string {
  if (lang === "hi") {
    return "मैं केवल कृषि, बागवानी और सरकारी किसान योजनाओं से जुड़े प्रश्नों का उत्तर दे सकता हूँ।\n\nकृपया खेती, फसल, उर्वरक, सिंचाई, बीमा, या सरकारी किसान योजनाओं से संबंधित प्रश्न पूछें।\n\n📞 Kisan Call Center: 1800-180-1551";
  }
  if (lang === "hinglish") {
    return "Main sirf agriculture, bagwani aur sarkari kisan yojanaon ke baare mein jawab de sakta hoon.\n\nKripya kheti, fasal, khad, sinchai, bima, ya sarkari yojana se related sawaal poochhein.\n\n📞 Kisan Call Center: 1800-180-1551";
  }
  return "I can only answer questions related to agriculture, horticulture, and government farmer schemes.\n\nPlease ask about farming, crops, fertilizers, irrigation, insurance, or government agriculture schemes.\n\n📞 Kisan Call Center: 1800-180-1551";
}

function getHazardousChemicalResponse(
  chemical: HazardousChemical,
  lang: DetectedLanguage
): string {
  const bannedNote = chemical.isBanned
    ? lang === "hi"
      ? "⚠️ यह रसायन भारत सरकार द्वारा प्रतिबंधित है।"
      : lang === "hinglish"
      ? "⚠️ Yeh chemical India mein ban hai."
      : "⚠️ This chemical is BANNED in India."
    : lang === "hi"
    ? "⚠️ यह अत्यंत खतरनाक रसायन है। केवल विशेषज्ञ की देखरेख में उपयोग करें।"
    : lang === "hinglish"
    ? "⚠️ Yeh bahut khatarnak chemical hai. Expert ki salah se hi use karein."
    : "⚠️ This is an extremely hazardous chemical. Use only under expert supervision.";

  if (lang === "hi") {
    return `${bannedNote}\n\n🔴 सुरक्षा निर्देश:\n• इस रसायन का उपयोग बच्चों और महिलाओं के पास न करें\n• पूर्ण सुरक्षात्मक उपकरण (मास्क, दस्ताने, गॉगल्स) पहनें\n• जल स्रोतों के पास उपयोग न करें\n\nसुरक्षित विकल्प के लिए अपने नजदीकी KVK या कृषि अधिकारी से संपर्क करें।\n📞 Kisan Call Center: 1800-180-1551`;
  }
  if (lang === "hinglish") {
    return `${bannedNote}\n\n🔴 Safety tips:\n• Bacchon aur mahilaon ke paas use mat karein\n• Mask, gloves, aur goggles zaroor pehne\n• Paani ke srot ke paas spray nahi karna\n\nSafe option ke liye apne KVK ya krishi adhikari se baat karein.\n📞 Kisan Call Center: 1800-180-1551`;
  }
  return `${bannedNote}\n\n🔴 Safety Instructions:\n• Keep away from children and women\n• Always wear mask, gloves, and safety goggles\n• Do not spray near water sources or food storage\n\nFor a safer alternative, consult your nearest KVK or Agriculture Officer.\n📞 Kisan Call Center: 1800-180-1551`;
}

function getInjectionBlockResponse(lang: DetectedLanguage): string {
  if (lang === "hi") return "मैं केवल कृषि संबंधित प्रश्नों का उत्तर दे सकता हूँ। कृपया सही प्रश्न पूछें।";
  if (lang === "hinglish") return "Main sirf kheti se related sawaal ka jawab de sakta hoon.";
  return "I can only answer agriculture-related questions. Please ask a valid farming question.";
}

function getAbuseResponse(lang: DetectedLanguage): string {
  if (lang === "hi") return "मैं किसान सेवा के लिए यहाँ हूँ। कृपया शिष्टाचार के साथ प्रश्न पूछें।\n\n📞 सहायता: 1800-180-1551";
  if (lang === "hinglish") return "Main aapki madad ke liye hoon. Kripya seedha sawaal poochhein.\n\n📞 Sahayata: 1800-180-1551";
  return "I am here to help farmers. Please ask your agriculture questions politely.\n\n📞 Help: 1800-180-1551";
}

// ─── PII Redaction ─────────────────────────────────────────────────────────────

function redactPII(text: string): { redacted: string; hadPII: boolean } {
  let result = text;
  let hadPII = false;

  for (const { pattern, replacement } of PII_PATTERNS) {
    // Check if there are 4-digit groups that could be Aadhaar vs plain numbers
    // Only redact if it looks like PII (Aadhaar = 12 digit, account = 9-18 digit)
    if (pattern.test(result)) {
      hadPII = true;
      result = result.replace(pattern, replacement);
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
    }
    pattern.lastIndex = 0;
  }

  return { redacted: result, hadPII };
}

// ─── Main Guardrail Check ─────────────────────────────────────────────────────

/**
 * Runs all safety checks on the user query.
 * Returns a GuardrailResult indicating whether to pass, block, warn, or redact.
 */
export function runGuardrails(
  query: string,
  lang: DetectedLanguage
): GuardrailResult {
  const normalized = query.toLowerCase();

  // ── Check 1: Prompt Injection ──────────────────────────────────────────────
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return {
        action: "block",
        reason: "prompt_injection",
        response: getInjectionBlockResponse(lang),
      };
    }
  }

  // ── Check 2: Abusive Content ───────────────────────────────────────────────
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        action: "block",
        reason: "abusive_content",
        response: getAbuseResponse(lang),
      };
    }
  }

  // ── Check 3: Out-of-Domain ─────────────────────────────────────────────────
  // Only check if query is long enough to be a deliberate non-agri question
  if (query.trim().length > 15) {
    for (const pattern of OUT_OF_DOMAIN_PATTERNS) {
      if (pattern.test(normalized)) {
        return {
          action: "block",
          reason: "out_of_domain",
          response: getOutOfDomainResponse(lang),
        };
      }
    }
  }

  // ── Check 4: Hazardous / Banned Chemicals ─────────────────────────────────
  for (const chemical of HAZARDOUS_CHEMICALS) {
    for (const name of chemical.names) {
      if (normalized.includes(name.toLowerCase())) {
        // For extreme risk, block; for high risk, warn with advisory
        if (chemical.riskLevel === "extreme" || chemical.isBanned) {
          return {
            action: "warn",
            reason: "hazardous_chemical",
            safeQuery: query, // Allow enriched processing too
            response: getHazardousChemicalResponse(chemical, lang),
          };
        }
      }
    }
  }

  // ── Check 5: PII Redaction ─────────────────────────────────────────────────
  const { redacted, hadPII } = redactPII(query);
  if (hadPII) {
    return {
      action: "redact",
      reason: "pii_detected",
      safeQuery: redacted,
    };
  }

  // ── All checks passed ──────────────────────────────────────────────────────
  return {
    action: "pass",
    safeQuery: query,
  };
}

/**
 * Quick check: Is this query clearly out of agriculture domain?
 * Used by classifier to reject queries before knowledge base lookup.
 */
export function isOutOfDomain(query: string): boolean {
  const normalized = query.toLowerCase();
  if (query.trim().length <= 15) return false;
  return OUT_OF_DOMAIN_PATTERNS.some((p) => p.test(normalized));
}
