import type { Language } from "../translations";
import type { WidgetMessage } from "../components/AgricultureChatWidget";
import { getOverrideIp } from "./rateLimiter";
import type { ChatSession } from "./sessionManager";

export interface ServerQueryResponse {
  success: boolean;
  answer: string;
  source?: {
    title: string;
    department: string;
    url?: string;
  };
  session?: ChatSession;
  rateLimit?: {
    allowed: boolean;
    ip: string;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    windowSeconds: number;
  };
  error?: string;
  message?: string;
  messageHi?: string;
  retryAfter?: number;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const overrideIp = getOverrideIp();
  if (overrideIp) {
    headers["x-client-ip"] = overrideIp;
  }
  return headers;
}

/**
 * Sends a query to the backend /api/chat endpoint
 * Backend enforces 5 queries/minute rate limit per IP and manages session cookies
 */
export async function sendQueryApi(
  question: string,
  lang: Language,
  sessionId?: string,
  signal?: AbortSignal,
): Promise<ServerQueryResponse> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: getHeaders(),
      credentials: "same-origin", // Pass and receive HttpOnly session cookie
      body: JSON.stringify({ question, lang, sessionId }),
      signal,
    });

    const data = await res.json();

    if (res.status === 429) {
      return {
        success: false,
        answer: "",
        error: data.message || "Query rate limit reached.",
        message: data.message,
        messageHi: data.messageHi,
        retryAfter: data.retryAfter || 60,
        rateLimit: {
          allowed: false,
          ip: data.ip || "Your IP",
          limit: data.limit || 5,
          remaining: 0,
          retryAfterSeconds: data.retryAfter || 60,
          windowSeconds: 60,
        },
      };
    }

    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
    console.error("Failed to query backend server:", err);
    throw err;
  }
}

/**
 * Fetch sessions stored on the server for the current client IP
 */
export async function fetchServerSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch("/api/sessions", {
      headers: getHeaders(),
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = await res.json();
      return data.sessions || [];
    }
  } catch (err) {
    console.error("Failed to fetch sessions from server:", err);
  }
  return [];
}

/**
 * Create a new session on the server
 */
export async function createServerSessionApi(lang: Language): Promise<ChatSession | null> {
  try {
    const res = await fetch("/api/session/new", {
      method: "POST",
      headers: getHeaders(),
      credentials: "same-origin",
      body: JSON.stringify({ lang }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.session || null;
    }
  } catch (err) {
    console.error("Failed to create session on server:", err);
  }
  return null;
}

/**
 * Delete active session on the server
 */
export async function deleteServerSessionApi(): Promise<boolean> {
  try {
    const res = await fetch("/api/session", {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "same-origin",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete session on server:", err);
    return false;
  }
}

/**
 * Clear all sessions for client IP on the server
 */
export async function clearServerSessionsApi(): Promise<boolean> {
  try {
    const res = await fetch("/api/sessions", {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "same-origin",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to clear sessions on server:", err);
    return false;
  }
}

/**
 * Get server query rate limit status for current IP
 */
export async function fetchServerRateLimit(): Promise<any | null> {
  try {
    const res = await fetch("/api/ratelimit", {
      headers: getHeaders(),
      credentials: "same-origin",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch rate limit from server:", err);
  }
  return null;
}

/**
 * Reset query rate limit quota on the server for client IP (Demo mode)
 */
export async function resetServerQuotaApi(): Promise<any | null> {
  try {
    const res = await fetch("/api/ratelimit/reset", {
      method: "POST",
      headers: getHeaders(),
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = await res.json();
      return data.status || null;
    }
  } catch (err) {
    console.error("Failed to reset rate limit on server:", err);
  }
  return null;
}
