/**
 * Agriculture Query Classification Engine
 * Classifies user queries into 16 agricultural domain categories
 * with multi-language support (English, Hindi, Hinglish).
 */

import type { DetectedLanguage } from "./languageDetector";

// ─── Domain Category Definitions ─────────────────────────────────────────────

export type AgriDomain =
  | "crop_guidance"
  | "government_schemes"
  | "crop_insurance"
  | "soil_and_fertilizer"
  | "pest_and_disease"
  | "irrigation_and_water"
  | "horticulture"
  | "seeds_and_sowing"
  | "kisan_credit_and_loans"
  | "market_and_msp"
  | "organic_farming"
  | "machinery_and_tools"
  | "weather_and_climate"
  | "training_and_institutes"
  | "helpline_and_emergency"
  | "farmer_registration"
  | "general_agriculture"
  | "unknown";

export interface DomainLabel {
  en: string;
  hi: string;
  hinglish: string;
  emoji: string;
}

export const DOMAIN_LABELS: Record<AgriDomain, DomainLabel> = {
  crop_guidance: {
    en: "Crop Advisory",
    hi: "फसल मार्गदर्शन",
    hinglish: "Fasal Salah",
    emoji: "🌾",
  },
  government_schemes: {
    en: "Government Schemes",
    hi: "सरकारी योजनाएं",
    hinglish: "Sarkari Yojana",
    emoji: "🏛️",
  },
  crop_insurance: {
    en: "Crop Insurance",
    hi: "फसल बीमा",
    hinglish: "Fasal Bima",
    emoji: "🛡️",
  },
  soil_and_fertilizer: {
    en: "Soil & Fertilizer",
    hi: "मृदा एवं उर्वरक",
    hinglish: "Mitti aur Khad",
    emoji: "🌱",
  },
  pest_and_disease: {
    en: "Pest & Disease Control",
    hi: "कीट एवं रोग नियंत्रण",
    hinglish: "Keet aur Bimari",
    emoji: "🐛",
  },
  irrigation_and_water: {
    en: "Irrigation & Water",
    hi: "सिंचाई एवं जल प्रबंधन",
    hinglish: "Sinchai aur Paani",
    emoji: "💧",
  },
  horticulture: {
    en: "Horticulture",
    hi: "उद्यानिकी",
    hinglish: "Bagwani",
    emoji: "🍅",
  },
  seeds_and_sowing: {
    en: "Seeds & Sowing",
    hi: "बीज एवं बुवाई",
    hinglish: "Beej aur Buwai",
    emoji: "🌰",
  },
  kisan_credit_and_loans: {
    en: "Kisan Credit & Loans",
    hi: "किसान क्रेडिट एवं ऋण",
    hinglish: "Kisan Loan",
    emoji: "💳",
  },
  market_and_msp: {
    en: "Market & MSP",
    hi: "बाज़ार एवं MSP",
    hinglish: "Mandi aur Bhav",
    emoji: "📊",
  },
  organic_farming: {
    en: "Organic Farming",
    hi: "जैविक खेती",
    hinglish: "Jaivik Kheti",
    emoji: "🌿",
  },
  machinery_and_tools: {
    en: "Farm Machinery",
    hi: "कृषि यंत्र",
    hinglish: "Krishi Yantra",
    emoji: "🚜",
  },
  weather_and_climate: {
    en: "Weather & Climate",
    hi: "मौसम एवं जलवायु",
    hinglish: "Mausam",
    emoji: "🌦️",
  },
  training_and_institutes: {
    en: "Training & Institutes",
    hi: "प्रशिक्षण एवं संस्थान",
    hinglish: "Training aur KVK",
    emoji: "🎓",
  },
  helpline_and_emergency: {
    en: "Helpline & Support",
    hi: "हेल्पलाइन एवं सहायता",
    hinglish: "Helpline",
    emoji: "📞",
  },
  farmer_registration: {
    en: "Farmer Registration",
    hi: "किसान पंजीयन",
    hinglish: "Kisan Registration",
    emoji: "📋",
  },
  general_agriculture: {
    en: "Agriculture",
    hi: "कृषि",
    hinglish: "Kheti-Badi",
    emoji: "🌾",
  },
  unknown: {
    en: "General",
    hi: "सामान्य",
    hinglish: "General",
    emoji: "💬",
  },
};

// ─── Domain Keyword Map (all 3 languages + Hinglish) ─────────────────────────

interface DomainRule {
  domain: AgriDomain;
  keywords: string[];
  weight: number; // multiplier for keyword score
}

const DOMAIN_RULES: DomainRule[] = [
  // ── 1. Crop Guidance ───────────────────────────────────────────────────────
  {
    domain: "crop_guidance",
    weight: 1.0,
    keywords: [
      "crop guidance", "crop advice", "crop tips", "crop cultivation",
      "farming guidance", "fasal salah", "fasal advice", "kheti guidance",
      "which crop", "best crop", "crop variety", "crop selection",
      "kharif crops", "rabi crops", "zaid crops",
      "paddy cultivation", "wheat cultivation", "dhan ki kheti",
      "sowing time", "buwai ka samay", "planting season",
      "crop rotation", "fasal chakra",
      "फसल मार्गदर्शन", "फसल सलाह", "खेती की सलाह", "फसल उत्पादन",
      "कौन सी फसल", "फसल चक्र", "बुवाई का समय",
    ],
  },

  // ── 2. Government Schemes ──────────────────────────────────────────────────
  {
    domain: "government_schemes",
    weight: 1.2,
    keywords: [
      "government scheme", "agriculture scheme", "farmer scheme",
      "sarkari yojana", "kisan yojana", "schemes for farmers",
      "pm kisan", "pmkisan", "pm-kisan", "pm kishan", "pm-kishan", "kisan samman nidhi",
      "pm kisan age limit", "pm kishan age", "age limit", "eligibility",
      "rkvy", "rashtriya krishi vikas", "nfsm", "national food security",
      "isopom", "smam", "pkvy", "paramparagat krishi",
      "state scheme", "central scheme", "subsidy scheme",
      "benefit transfer", "dbt", "direct benefit",
      "सरकारी योजनाएं", "किसान योजना", "पीएम किसान", "आरकेवीवाई",
      "kisan samman", "rashtriya", "yojana apply", "patrata", "aayu seema",
    ],
  },

  // ── 3. Crop Insurance ─────────────────────────────────────────────────────
  {
    domain: "crop_insurance",
    weight: 1.3,
    keywords: [
      "crop insurance", "fasal bima", "pmfby", "pradhan mantri fasal bima",
      "insurance premium", "crop loss", "fasal nuksan", "insurance claim",
      "bima claim", "compensation", "muavza", "crop damage",
      "natural disaster", "flood damage", "drought loss",
      "72 hour", "loss intimation", "surveyor",
      "14447", "crop insurance helpline",
      "फसल बीमा", "बीमा क्लेम", "फसल क्षति", "मुआवजा",
      "प्रीमियम", "बाढ़", "सूखा", "ओलावृष्टि",
    ],
  },

  // ── 4. Soil & Fertilizer ──────────────────────────────────────────────────
  {
    domain: "soil_and_fertilizer",
    weight: 1.1,
    keywords: [
      "soil health", "soil card", "soil test", "mitti parikshan",
      "soil health card", "mitti jaanch", "fertilizer", "urvarak",
      "urea", "dap", "npk", "potash", "fertiliser",
      "subsidized fertilizer", "khad", "khaad",
      "nutrient deficiency", "poshan tatva", "nitrogen",
      "phosphorus", "potassium", "zinc deficiency",
      "organic manure", "compost", "vermicompost",
      "soil ph", "soil fertility", "soil analysis",
      "मृदा स्वास्थ्य", "मिट्टी जांच", "उर्वरक", "खाद",
      "यूरिया", "डीएपी", "पोटाश", "मिट्टी परीक्षण",
    ],
  },

  // ── 5. Pest & Disease ─────────────────────────────────────────────────────
  {
    domain: "pest_and_disease",
    weight: 1.2,
    keywords: [
      "pest control", "pesticide", "keetonashak", "insecticide",
      "fungicide", "pest management", "crop disease", "bimari",
      "blast disease", "brown spot", "yellow mosaic",
      "stem borer", "leaf blight", "aphids", "locust",
      "neem spray", "ipm", "integrated pest management",
      "dawa chhidkaw", "spray", "organic spray",
      "कीटनाशक", "कीट नियंत्रण", "फसल रोग", "फफूंदनाशक",
      "दवाई छिड़काव", "नीम तेल", "कीड़े",
    ],
  },

  // ── 6. Irrigation & Water ─────────────────────────────────────────────────
  {
    domain: "irrigation_and_water",
    weight: 1.0,
    keywords: [
      "irrigation", "drip irrigation", "sprinkler", "micro irrigation",
      "pmksy", "per drop more crop", "water management",
      "sinchai", "paani", "drip sinchai", "tanka sinchai",
      "borewell", "tubewell", "canal", "nali", "talab", "kua",
      "water harvesting", "jal sanchay", "rainwater",
      "irrigation subsidy", "sinchai anudan",
      "ड्रिप सिंचाई", "स्प्रिंकलर", "सिंचाई", "जल प्रबंधन",
      "सूक्ष्म सिंचाई", "पीएमकेएसवाई",
    ],
  },

  // ── 7. Horticulture ───────────────────────────────────────────────────────
  {
    domain: "horticulture",
    weight: 1.0,
    keywords: [
      "horticulture", "vegetable farming", "fruit farming",
      "sabzi kheti", "phal utpadan", "bagwani",
      "nhm", "midh", "polyhouse", "greenhouse", "shadenet",
      "nursery", "planting material", "hybrid vegetable",
      "tomato", "onion", "potato", "tamatar", "pyaz", "aloo",
      "banana", "mango", "papaya", "kela", "aam",
      "उद्यानिकी", "सब्जी खेती", "बागवानी", "फलों की खेती",
    ],
  },

  // ── 8. Seeds & Sowing ────────────────────────────────────────────────────
  {
    domain: "seeds_and_sowing",
    weight: 1.0,
    keywords: [
      "seed", "beej", "certified seed", "quality seed", "unnat beej",
      "seed subsidy", "beej anudan", "beej nigam", "crop variety",
      "hybrid seed", "oilseed", "pulses seed",
      "seed treatment", "beej upchar", "seed bank",
      "बीज", "प्रमाणित बीज", "उन्नत बीज", "बीज अनुदान",
      "बीज निगम", "धान का बीज",
    ],
  },

  // ── 9. Kisan Credit & Loans ───────────────────────────────────────────────
  {
    domain: "kisan_credit_and_loans",
    weight: 1.2,
    keywords: [
      "kisan credit card", "kcc", "crop loan", "agricultural loan",
      "kisan loan", "farm credit", "krishi rin", "rin",
      "bank loan", "interest rate", "4 percent", "4%",
      "short term loan", "gold loan", "collateral",
      "repayment", "waiver", "karz maafi",
      "किसान क्रेडिट कार्ड", "केसीसी", "कृषि ऋण", "फसली ऋण",
      "ब्याज दर", "ऋण माफी",
    ],
  },

  // ── 10. Market & MSP ─────────────────────────────────────────────────────
  {
    domain: "market_and_msp",
    weight: 1.1,
    keywords: [
      "msp", "minimum support price", "procurement price",
      "paddy price", "wheat price", "government purchase",
      "mandi rate", "mandi bhav", "bazaar bhav",
      "e-nam", "enam", "national agriculture market",
      "commodity price", "market price", "selling rate",
      "kharidi", "uparjan kendra", "procurement center",
      "एमएसपी", "न्यूनतम समर्थन मूल्य", "मंडी भाव",
      "सरकारी खरीद", "उपार्जन",
    ],
  },

  // ── 11. Organic Farming ───────────────────────────────────────────────────
  {
    domain: "organic_farming",
    weight: 1.0,
    keywords: [
      "organic farming", "jaivik kheti", "natural farming",
      "paramparagat krishi", "pkvy", "organic certification",
      "pgs", "bio input", "compost", "vermicompost", "jeevamrit",
      "gobar gas", "cow dung", "green manure", "harit khad",
      "जैविक खेती", "प्राकृतिक खेती", "जैविक प्रमाणीकरण",
      "गोबर खाद", "वर्मी कम्पोस्ट",
    ],
  },

  // ── 12. Farm Machinery ────────────────────────────────────────────────────
  {
    domain: "machinery_and_tools",
    weight: 1.0,
    keywords: [
      "farm machinery", "tractor", "harvester", "combine harvester",
      "power tiller", "smam", "machinery subsidy", "yantra anudan",
      "thresher", "sprayer", "rotavator", "cultivator",
      "solar pump", "water pump", "bijli pump",
      "कृषि यंत्र", "ट्रैक्टर", "सोलर पंप", "यंत्र अनुदान",
    ],
  },

  // ── 13. Weather & Climate ─────────────────────────────────────────────────
  {
    domain: "weather_and_climate",
    weight: 0.9,
    keywords: [
      "weather", "rainfall", "mausam", "barish", "varsha",
      "drought", "sukha", "flood", "baadh", "frost", "pala",
      "temperature", "tapman", "forecast", "bhavishyavani",
      "climate change", "jalvayu parivartan",
      "monsoon", "mansoon", "kharif season", "rabi season",
      "मौसम", "बारिश", "सूखा", "बाढ़", "मानसून",
    ],
  },

  // ── 14. Training & Institutes ─────────────────────────────────────────────
  {
    domain: "training_and_institutes",
    weight: 1.0,
    keywords: [
      "training", "kvk", "krishi vigyan kendra", "farmer training",
      "workshop", "demonstration", "kisan mela", "agriculture fair",
      "igkv", "agricultural university", "extension officer",
      "prashikshan", "krishi kendra", "siksha",
      "कृषि विज्ञान केंद्र", "प्रशिक्षण", "किसान मेला",
    ],
  },

  // ── 15. Helpline & Emergency ──────────────────────────────────────────────
  {
    domain: "helpline_and_emergency",
    weight: 1.3,
    keywords: [
      "helpline", "toll free", "contact number", "phone number",
      "1800-180-1551", "14447", "155261", "0771",
      "kisan call center", "help number", "customer care",
      "emergency", "sampark", "complaint",
      "हेल्पलाइन", "टोल फ्री", "किसान कॉल सेंटर", "संपर्क",
    ],
  },

  // ── 16. Farmer Registration ───────────────────────────────────────────────
  {
    domain: "farmer_registration",
    weight: 1.1,
    keywords: [
      "farmer registration", "kisan registration", "register farmer",
      "panjeeyan", "panjiyan", "agriculture registration",
      "farmer id", "aadhaar link", "land record",
      "b1 p2", "rin pustika", "kin pustika",
      "portal registration", "agriportal",
      "किसान पंजीयन", "किसान रजिस्ट्रेशन", "आधार लिंक",
    ],
  },

  // ── 17. General Agriculture ───────────────────────────────────────────────
  {
    domain: "general_agriculture",
    weight: 0.5,
    keywords: [
      "agriculture", "farming", "krishi", "kheti", "kisan", "farmer",
      "agricultural", "कृषि", "खेती", "किसान",
    ],
  },
];

const SCHEME_IDENTIFIERS = [
  "pm kisan", "pmkisan", "pm-kisan", "kisan samman nidhi", "pm kishan", "pm-kishan",
  "pmfby", "pm fasal bima", "kisan credit card", "kcc", "rkvy", "nfsm", "pkvy",
  "soil health card", "pmksy", "smam",
];

/** Return true when eligibility is asked without identifying which scheme. */
export function requiresSchemeClarification(query: string, activeScheme?: string | null): boolean {
  const normalized = query.toLowerCase()
    .replace(/\bkishan\b/g, "kisan")
    .replace(/\bkisaan\b/g, "kisan")
    .replace(/\bkissan\b/g, "kisan")
    .replace(/\byojna\b/g, "yojana");
  const asksEligibility = /\b(eligible|eligibility|qualify|qualification|patrata|yogya)\b|पात्रता|पात्र हैं|योग्य/i.test(normalized);
  const hasScheme = Boolean(activeScheme) || SCHEME_IDENTIFIERS.some((scheme) => normalized.includes(scheme));
  return asksEligibility && !hasScheme;
}

// ─── Classification Result ────────────────────────────────────────────────────

export interface ClassificationResult {
  domain: AgriDomain;
  label: DomainLabel;
  confidence: number;
  matchedKeywords: string[];
  isAgricultural: boolean;
}

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classifies a user query into one of 16 agricultural domains.
 * Uses keyword scoring with domain weights.
 */
export function classifyQuery(
  query: string,
  _detectedLang?: DetectedLanguage
): ClassificationResult {
  const raw = query.toLowerCase().trim();
  const normalized = raw
    .replace(/\bkishan\b/g, "kisan")
    .replace(/\bkisaan\b/g, "kisan")
    .replace(/\bkissan\b/g, "kisan")
    .replace(/\byojna\b/g, "yojana")
    .replace(/\bphasal\b/g, "fasal")
    .replace(/\bsaman\b/g, "samman");
  const scores = new Map<AgriDomain, { score: number; matched: string[] }>();

  // Initialize all domains
  for (const rule of DOMAIN_RULES) {
    scores.set(rule.domain, { score: 0, matched: [] });
  }

  // Score each domain
  for (const rule of DOMAIN_RULES) {
    const entry = scores.get(rule.domain)!;
    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();
      if (raw.includes(kwLower) || normalized.includes(kwLower)) {
        // Score = keyword length × domain weight (longer = more specific)
        entry.score += kw.length * rule.weight;
        entry.matched.push(kw);
      }
    }
  }

  // Find best match
  let bestDomain: AgriDomain = "unknown";
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const [domain, { score, matched }] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
      bestMatched = matched;
    }
  }

  // Normalize confidence
  const maxPossibleScore = 200; // heuristic maximum
  const confidence = bestScore > 0
    ? Math.min(0.98, bestScore / maxPossibleScore)
    : 0;

  const isAgricultural = bestDomain !== "unknown" && bestScore >= 5;

  return {
    domain: isAgricultural ? bestDomain : "unknown",
    label: DOMAIN_LABELS[isAgricultural ? bestDomain : "unknown"],
    confidence,
    matchedKeywords: bestMatched,
    isAgricultural,
  };
}

/**
 * Returns the human-readable domain label for the detected language
 */
export function getDomainLabel(
  domain: AgriDomain,
  lang: DetectedLanguage
): string {
  const label = DOMAIN_LABELS[domain];
  const text = lang === "hi" ? label.hi : lang === "hinglish" ? label.hinglish : label.en;
  return `${label.emoji} ${text}`;
}
