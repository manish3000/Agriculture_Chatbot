import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  source?: {
    title: string;
    department: string;
    url?: string;
  };
  timestamp: number;
}

export interface UserSession {
  sessionId: string;
  clientIp: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  title: string;
  lang: "en" | "hi";
  messages: ChatMessage[];
}

// Session TTL: 24 Hours
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "cg_session_id";

// In-Memory Session Store: Map<sessionId, UserSession>
const sessions = new Map<string, UserSession>();
let messageCounter = 1;

/**
 * Generates cryptographically secure, unique Session ID
 */
export function generateSecureSessionId(): string {
  const randomHex = crypto.randomBytes(12).toString("hex");
  return `cg_sess_${Date.now()}_${randomHex}`;
}

/**
 * Creates a new secure session
 */
export function createSession(
  clientIp: string,
  lang: "en" | "hi" = "en",
  initialTitle?: string,
): UserSession {
  const now = Date.now();
  const sessionId = generateSecureSessionId();
  const title =
    initialTitle ||
    (lang === "hi" ? "नया कृषि परामर्श" : "New Agriculture Consultation");

  const newSession: UserSession = {
    sessionId,
    clientIp,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + SESSION_TTL_MS,
    title,
    lang,
    messages: [],
  };

  sessions.set(sessionId, newSession);
  console.log(`[SessionManager] Created secure session ${sessionId} for IP`);
  return newSession;
}

/**
 * Gets an active session, renewing its expiration if valid
 */
export function getSession(sessionId: string): UserSession | null {
  if (!sessionId || typeof sessionId !== "string") return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  const now = Date.now();
  if (now > session.expiresAt) {
    // Session expired
    sessions.delete(sessionId);
    console.log(`[SessionManager] Purged expired session ${sessionId}`);
    return null;
  }

  // Touch and extend session
  session.lastActivityAt = now;
  session.expiresAt = now + SESSION_TTL_MS;
  return session;
}

/**
 * Adds a message to an existing session
 */
export function addMessageToSession(
  sessionId: string,
  message: {
    role: "user" | "assistant";
    text: string;
    source?: {
      title: string;
      department: string;
      url?: string;
    };
  },
): { session: UserSession; message: ChatMessage } | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const msg: ChatMessage = {
    id: messageCounter++,
    role: message.role,
    text: message.text,
    source: message.source,
    timestamp: Date.now(),
  };

  // Derive title from first user query
  if (session.messages.length === 0 && message.role === "user") {
    const trimmed = message.text.trim();
    session.title =
      trimmed.length > 34 ? trimmed.slice(0, 32) + "…" : trimmed;
  }

  session.messages.push(msg);
  session.lastActivityAt = Date.now();
  return { session, message: msg };
}

/**
 * Deletes a session (Logout/End consultation)
 */
export function destroySession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/**
 * Retrieves all sessions for a specific IP (Session History)
 */
export function getSessionsByIp(clientIp: string): UserSession[] {
  const now = Date.now();
  const list: UserSession[] = [];

  for (const session of sessions.values()) {
    if (session.clientIp === clientIp && session.expiresAt > now) {
      list.push(session);
    }
  }

  return list.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
}

/**
 * Clears all sessions for an IP
 */
export function clearAllSessionsForIp(clientIp: string): void {
  for (const [id, session] of sessions.entries()) {
    if (session.clientIp === clientIp) {
      sessions.delete(id);
    }
  }
}

/**
 * Extract Session ID from request cookies or Authorization header
 */
export function extractSessionId(req: IncomingMessage): string | null {
  // 1. From Cookie header
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${COOKIE_NAME}=`)) {
        return decodeURIComponent(cookie.substring(COOKIE_NAME.length + 1));
      }
    }
  }

  // 2. From X-Session-Id header (for API clients)
  const headerSessionId = req.headers["x-session-id"];
  if (typeof headerSessionId === "string" && headerSessionId.trim()) {
    return headerSessionId.trim();
  }

  return null;
}

/**
 * Sets secure HTTP Cookie on ServerResponse
 */
export function setSessionCookie(
  res: ServerResponse,
  sessionId: string,
  isHttps: boolean = false,
): void {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const secureFlag = isHttps ? "; Secure" : "";
  const cookieValue = `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax${secureFlag}`;
  res.setHeader("Set-Cookie", cookieValue);
}

/**
 * Clears the session cookie
 */
export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
}

/**
 * Automatic background sweeper to clean up expired sessions
 */
export function startSessionCleanupSweep(intervalMs = 10 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    let purged = 0;
    for (const [id, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(id);
        purged++;
      }
    }
    if (purged > 0) {
      console.log(`[SessionManager] Automatic sweep cleaned ${purged} expired sessions. Total active: ${sessions.size}`);
    }
  }, intervalMs);
}

// Start background cleanup interval
startSessionCleanupSweep();
