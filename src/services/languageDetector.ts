/**
 * Language Detection Engine
 * Detects: Hindi (Devanagari script), Hinglish (Roman script Hindi), English
 * Agriculture-domain aware lexical + script-based multi-signal classifier.
 */

export type DetectedLanguage = "hi" | "hinglish" | "en";

export interface LanguageDetectionResult {
  language: DetectedLanguage;
  confidence: number; // 0.0 – 1.0
  signals: {
    devanagariRatio: number;
    hinglishScore: number;
    englishScore: number;
  };
}

// ─── Hinglish Agriculture Lexicon ────────────────────────────────────────────
// Common Romanized Hindi words used by Indian farmers in chat
const HINGLISH_AGRICULTURE_TOKENS = new Set([
  // General Hindi
  "kya", "hai", "kaise", "kab", "kahan", "kaun", "kitna", "kitni",
  "mujhe", "mera", "meri", "mere", "aur", "ya", "nahi", "nahin",
  "hain", "tha", "thi", "the", "ho", "kar", "karo", "karna",
  "bata", "batao", "chahiye", "milega", "milta", "milti", "bhi",
  "iske", "uski", "yeh", "woh", "isko", "usko", "inhe", "unhe",
  "se", "mein", "pe", "par", "ke", "ki", "ka", "ko", "ne",
  "hoga", "hogi", "hote", "hoti", "sakte", "sakti", "sakta",
  "kyun", "kyunki", "agar", "toh", "lekin", "aisa", "aise",
  "jab", "tab", "phir", "abhi", "bahut", "thoda", "sab", "kuch",
  "paise", "rupaye", "rupay", "lakh", "hajar", "crore",
  // Agriculture Hinglish
  "kheti", "kheti-badi", "khetibadi", "fasal", "fasalon",
  "dhan", "gehu", "gehun", "makka", "chana", "soyabean",
  "sarso", "sarson", "moong", "urad", "arhar", "tur",
  "khad", "khaad", "urvarak", "urea", "dap", "npk",
  "beej", "bij", "unnat beej", "certified beej",
  "keetonashak", "keetnaashak", "dawai", "dawa",
  "sinchai", "paani", "drip", "sprinkler", "naali",
  "mitti", "mitti jaanch", "mitti parikshan", "bhumi",
  "kisan", "kisaan", "krishak", "farmer log",
  "yojana", "scheme", "sarkari", "sarkar",
  "bima", "beema", "claim", "muavza",
  "mandi", "bazaar", "bazar", "bhav", "rate",
  "subsidy", "anudan", "sahayata",
  "panjeeyan", "panjikaran", "registration",
  "helpline", "sampark", "contact",
  "jaivik", "organic", "prakritic",
  "training", "prashikshan", "kendra", "kvk",
  "rin", "loan", "kcc", "bank",
  "msp", "samarthan mulya", "procurement",
  "urja", "bijli", "solar", "pump",
  "baarish", "mausam", "varsha", "sukha", "baadh",
  "machhar", "titli", "keed", "fungus", "bimari",
  "raksha", "suraksha", "bachao", "nuksaan",
  "harit", "green", "pairikarma", "paristhitik",
  "talab", "kua", "borwell", "bore well",
  "harvest", "katai", "threshing", "drying",
  "sarkari kharidi", "paddy procurement", "rice procurement",
  "rajya", "state", "zila", "jila", "block", "tehsil", "gram",
]);

// ─── Hinglish phrase patterns ────────────────────────────────────────────────
const HINGLISH_PHRASE_PATTERNS: RegExp[] = [
  /\b(kaise\s+kare|kaise\s+karen|kaise\s+milega|kaise\s+uthaye)\b/i,
  /\b(kya\s+hai|kya\s+hota|kya\s+milta|kya\s+kare)\b/i,
  /\b(kitna\s+milega|kitni\s+rashi|kitne\s+rupaye)\b/i,
  /\b(mujhe\s+chahiye|mujhe\s+bata|mujhe\s+jankari)\b/i,
  /\b(ke\s+liye|ke\s+baare|ke\s+liye\s+kya)\b/i,
  /\b(kahan\s+se|kahan\s+mile|kahan\s+jaye)\b/i,
  /\b(kaun\s+sa|kaun\s+si|kaun\s+se)\b/i,
  /\b(kab\s+tak|kab\s+milega|kab\s+aayega)\b/i,
  /\b(nahi\s+mila|nahin\s+mila|nahi\s+hua)\b/i,
  /\b(bata\s+do|bata\s+dijiye|batao\s+please)\b/i,
  /\b(fasal\s+bima|fasal\s+salah|fasal\s+me)\b/i,
  /\b(kisan\s+helpline|kisan\s+yojana|kisan\s+credit)\b/i,
  /\b(sarkari\s+yojana|sarkari\s+help|sarkari\s+subsidy)\b/i,
  /\b(kheti\s+kaise|kheti\s+me|kheti\s+ke)\b/i,
  /\b(mitti\s+jaanch|mitti\s+test|mitti\s+ka)\b/i,
];

// ─── Strong English-only agriculture keywords ────────────────────────────────
const ENGLISH_AGRICULTURE_TOKENS = new Set([
  "what", "which", "when", "where", "how", "why", "does", "should",
  "government", "scheme", "apply", "application", "eligible", "eligibility",
  "register", "registration", "certificate", "document",
  "fertilizer", "pesticide", "insecticide", "fungicide",
  "irrigation", "cultivation", "harvest", "sowing", "planting",
  "subsidy", "premium", "installment", "beneficiary",
  "insurance", "claim", "compensation", "survey",
  "minimum", "support", "price", "procurement",
  "organic", "natural", "integrated", "management",
  "weather", "rainfall", "forecast", "temperature",
  "market", "price", "mandi", "commodity",
  "credit", "loan", "interest", "repayment",
  "district", "block", "village", "farmer",
  "crop", "seed", "soil", "health",
]);

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Count Devanagari Unicode characters in text */
function countDevanagari(text: string): number {
  return (text.match(/[\u0900-\u097F]/g) || []).length;
}

/** Count alphabetic characters (Latin script) */
function countLatin(text: string): number {
  return (text.match(/[a-zA-Z]/g) || []).length;
}

/** Normalize text: lowercase, remove punctuation, collapse whitespace */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, " ").replace(/\s+/g, " ").trim();
}

/** Tokenize into words */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

// ─── Main Detection Function ─────────────────────────────────────────────────

/**
 * Detects the language of the given input text.
 * Returns: "hi" (Devanagari Hindi), "hinglish" (Romanized Hindi), or "en" (English)
 */
export function detectLanguage(rawText: string): LanguageDetectionResult {
  const text = normalize(rawText);
  const totalChars = rawText.replace(/\s/g, "").length || 1;

  // ── Signal 1: Devanagari ratio
  const devanagariCount = countDevanagari(rawText);
  const devanagariRatio = devanagariCount / totalChars;

  // Pure Hindi: high Devanagari ratio
  if (devanagariRatio >= 0.25) {
    return {
      language: "hi",
      confidence: Math.min(0.95, 0.6 + devanagariRatio),
      signals: { devanagariRatio, hinglishScore: 0, englishScore: 0 },
    };
  }

  // Mixed script (Devanagari + Roman) → likely Hinglish
  if (devanagariRatio > 0.05 && devanagariRatio < 0.25) {
    return {
      language: "hinglish",
      confidence: 0.75,
      signals: { devanagariRatio, hinglishScore: 0.6, englishScore: 0 },
    };
  }

  // ── Signal 2: Token overlap with Hinglish lexicon
  const tokens = tokenize(text);
  const totalTokens = tokens.length || 1;
  let hinglishHits = 0;

  for (const token of tokens) {
    if (HINGLISH_AGRICULTURE_TOKENS.has(token)) hinglishHits++;
  }

  // ── Signal 3: Hinglish phrase patterns
  let phraseHits = 0;
  for (const pattern of HINGLISH_PHRASE_PATTERNS) {
    if (pattern.test(text)) phraseHits++;
  }

  const hinglishScore = Math.min(
    1.0,
    hinglishHits / totalTokens + phraseHits * 0.15
  );

  // ── Signal 4: English token overlap
  let englishHits = 0;
  for (const token of tokens) {
    if (ENGLISH_AGRICULTURE_TOKENS.has(token)) englishHits++;
  }
  const latinCount = countLatin(rawText);
  const englishScore = Math.min(
    1.0,
    englishHits / totalTokens + (latinCount / totalChars) * 0.2
  );

  // ── Decision: Hinglish vs English ─────────────────────────────────────────
  // Hinglish threshold: needs at least 1 strong Hinglish signal
  if (hinglishScore > 0.18 || (hinglishHits >= 1 && phraseHits >= 1)) {
    const confidence = Math.min(0.92, 0.5 + hinglishScore * 0.8);
    return {
      language: "hinglish",
      confidence,
      signals: { devanagariRatio, hinglishScore, englishScore },
    };
  }

  // Fallback: English
  return {
    language: "en",
    confidence: Math.min(0.95, 0.45 + englishScore * 0.8),
    signals: { devanagariRatio, hinglishScore, englishScore },
  };
}

/**
 * Simple helper: just returns the detected language string
 */
export function getLanguage(text: string): DetectedLanguage {
  return detectLanguage(text).language;
}

/**
 * Maps DetectedLanguage to the app's Language type (hinglish → "en" for UI,
 * but preserves "hinglish" for answer generation)
 */
export function toAppLanguage(detected: DetectedLanguage): "en" | "hi" {
  return detected === "hi" ? "hi" : "en";
}
