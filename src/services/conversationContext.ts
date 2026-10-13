/**
 * Conversation Context Manager
 * Tracks multi-turn dialogue state: active crop, domain, topic memory.
 * Enables follow-up resolution: "Is mein kya khad dale?" → resolves "Is mein" to last discussed crop.
 */

import type { DetectedLanguage } from "./languageDetector";
import type { AgriDomain } from "./agricultureClassifier";

// ─── Context State ────────────────────────────────────────────────────────────

export interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  detectedLang?: DetectedLanguage;
  domain?: AgriDomain;
}

export interface ConversationContext {
  sessionId: string;
  turns: ConversationTurn[];
  activeCrop: string | null;       // e.g. "paddy", "wheat", "tomato"
  activeDomain: AgriDomain | null; // last classified domain
  activeScheme: string | null;     // e.g. "PM-KISAN", "PMFBY"
  preferredLang: DetectedLanguage; // dominant language in this session
  lastUpdated: number;
}

// ─── In-memory context store ──────────────────────────────────────────────────
// Keyed by sessionId; TTL-based cleanup

const contextStore = new Map<string, ConversationContext>();
const CONTEXT_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Crop Entity Lexicon ──────────────────────────────────────────────────────
// Maps mention → canonical crop name

const CROP_MENTIONS: Record<string, string> = {
  // Kharif crops
  "paddy": "paddy", "rice": "paddy", "dhan": "paddy",
  "dhaan": "paddy", "chawal": "paddy",
  "maize": "maize", "corn": "maize", "makka": "maize",
  "soyabean": "soybean", "soybean": "soybean",
  "cotton": "cotton", "kapas": "cotton", "kapas ki kheti": "cotton",
  "groundnut": "groundnut", "mungfali": "groundnut",
  "sunflower": "sunflower", "surajmukhi": "sunflower",
  "sugarcane": "sugarcane", "ganna": "sugarcane",
  "arhar": "pigeon pea", "tur": "pigeon pea", "toor": "pigeon pea",
  "moong": "moong dal", "urad": "urad dal",
  // Rabi crops
  "wheat": "wheat", "gehu": "wheat", "gehun": "wheat",
  "mustard": "mustard", "sarso": "mustard", "sarson": "mustard",
  "gram": "chickpea", "chana": "chickpea",
  "lentil": "lentil", "masoor": "lentil",
  "peas": "peas", "matar": "peas",
  "barley": "barley", "jau": "barley",
  // Horticulture
  "tomato": "tomato", "tamatar": "tomato",
  "onion": "onion", "pyaz": "onion",
  "potato": "potato", "aloo": "potato",
  "brinjal": "brinjal", "baingan": "brinjal",
  "cauliflower": "cauliflower", "gobhi": "cauliflower",
  "mango": "mango", "aam": "mango",
  "banana": "banana", "kela": "banana",
  "papaya": "papaya", "papita": "papaya",
  "guava": "guava", "amrud": "guava",
};

// ─── Scheme Entity Lexicon ────────────────────────────────────────────────────

const SCHEME_MENTIONS: Record<string, string> = {
  "pm kisan": "PM-KISAN",
  "pmkisan": "PM-KISAN",
  "pm-kisan": "PM-KISAN",
  "kisan samman": "PM-KISAN",
  "fasal bima": "PMFBY",
  "pmfby": "PMFBY",
  "crop insurance": "PMFBY",
  "kcc": "KCC",
  "kisan credit": "KCC",
  "rkvy": "RKVY",
  "nfsm": "NFSM",
  "pkvy": "PKVY",
  "organic farming scheme": "PKVY",
  "soil health card": "Soil Health Card",
  "mitti card": "Soil Health Card",
  "smam": "SMAM",
  "machinery subsidy": "SMAM",
};

// ─── Follow-up Pronoun Patterns ───────────────────────────────────────────────

const FOLLOWUP_PRONOUNS: RegExp[] = [
  /\b(this|iske|iske liye|is mein|is fasal|is crop|is yojana|is scheme)\b/i,
  /\b(uske|usme|uska|uski|woh|voh)\b/i,
  /\b(iska|iski|isme|isko)\b/i,
  /\b(it|its|the same|that crop|that scheme|same one)\b/i,
  /\b(aur batao|aur kya|related|iske baare mein|more about)\b/i,
];

// ─── Context CRUD ─────────────────────────────────────────────────────────────

/**
 * Creates or retrieves the context for a session
 */
export function getOrCreateContext(sessionId: string): ConversationContext {
  // Prune expired contexts first
  pruneExpiredContexts();

  const existing = contextStore.get(sessionId);
  if (existing) {
    existing.lastUpdated = Date.now();
    return existing;
  }

  const newCtx: ConversationContext = {
    sessionId,
    turns: [],
    activeCrop: null,
    activeDomain: null,
    activeScheme: null,
    preferredLang: "en",
    lastUpdated: Date.now(),
  };
  contextStore.set(sessionId, newCtx);
  return newCtx;
}

/**
 * Records a new turn into the conversation context
 */
export function recordTurn(
  sessionId: string,
  turn: Omit<ConversationTurn, "timestamp">
): ConversationContext {
  const ctx = getOrCreateContext(sessionId);

  // Add turn with timestamp
  ctx.turns.push({ ...turn, timestamp: Date.now() });

  // Keep last 10 turns (5 exchanges) to avoid bloat
  if (ctx.turns.length > 10) {
    ctx.turns = ctx.turns.slice(-10);
  }

  // Update active entities if this is a user turn
  if (turn.role === "user") {
    const lower = turn.text.toLowerCase();

    // Extract active crop
    for (const [mention, canonical] of Object.entries(CROP_MENTIONS)) {
      if (lower.includes(mention)) {
        ctx.activeCrop = canonical;
        break;
      }
    }

    // Extract active scheme
    for (const [mention, canonical] of Object.entries(SCHEME_MENTIONS)) {
      if (lower.includes(mention)) {
        ctx.activeScheme = canonical;
        break;
      }
    }

    // Update domain if provided
    if (turn.domain) {
      ctx.activeDomain = turn.domain;
    }

    // Update preferred language
    if (turn.detectedLang) {
      ctx.preferredLang = turn.detectedLang;
    }
  }

  ctx.lastUpdated = Date.now();
  return ctx;
}

/**
 * Determines if this query is a follow-up to a previous turn
 */
export function isFollowUp(query: string): boolean {
  const lower = query.toLowerCase();
  // Short queries (< 30 chars) are often follow-ups
  if (query.trim().length < 30) {
    return FOLLOWUP_PRONOUNS.some((p) => p.test(lower));
  }
  return FOLLOWUP_PRONOUNS.some((p) => p.test(lower));
}

/**
 * Enriches a follow-up query with context from previous turns.
 * Example: "Iski kheti kaise kare?" + activeCrop=paddy → "Paddy ki kheti kaise kare?"
 */
export function enrichQueryWithContext(
  query: string,
  ctx: ConversationContext
): string {
  if (!isFollowUp(query)) return query;

  const parts: string[] = [];

  // Prepend active crop context
  if (ctx.activeCrop) {
    parts.push(`[Context: ${ctx.activeCrop}]`);
  }

  // Prepend active scheme context
  if (ctx.activeScheme) {
    parts.push(`[Scheme: ${ctx.activeScheme}]`);
  }

  // Prepend active domain context
  if (ctx.activeDomain) {
    parts.push(`[Domain: ${ctx.activeDomain}]`);
  }

  if (parts.length === 0) return query;

  return `${parts.join(" ")} ${query}`;
}

/**
 * Returns the last N turns as a formatted string for LLM context injection
 */
export function getConversationHistory(
  ctx: ConversationContext,
  maxTurns: number = 6
): Array<{ role: "user" | "assistant"; content: string }> {
  const recentTurns = ctx.turns.slice(-maxTurns);
  return recentTurns.map((t) => ({
    role: t.role,
    content: t.text,
  }));
}

/**
 * Clears context for a session (new chat / session reset)
 */
export function clearContext(sessionId: string): void {
  contextStore.delete(sessionId);
}

/**
 * Prune expired contexts older than TTL
 */
function pruneExpiredContexts(): void {
  const now = Date.now();
  for (const [id, ctx] of contextStore.entries()) {
    if (now - ctx.lastUpdated > CONTEXT_TTL_MS) {
      contextStore.delete(id);
    }
  }
}

/**
 * Returns a context summary for debugging/logging
 */
export function getContextSummary(ctx: ConversationContext): string {
  return JSON.stringify({
    turns: ctx.turns.length,
    activeCrop: ctx.activeCrop,
    activeDomain: ctx.activeDomain,
    activeScheme: ctx.activeScheme,
    preferredLang: ctx.preferredLang,
  });
}
