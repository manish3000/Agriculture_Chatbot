import type { IncomingMessage, ServerResponse } from "node:http";
import { extractClientIp, maskIpForPrivacy } from "./ipResolver";
import {
  checkRateLimit,
  consumeRateLimit,
  resetRateLimitForIp,
  applyRateLimitHeaders,
  RATE_LIMIT_MAX_QUERIES,
} from "./rateLimiter";
import {
  createSession,
  getSession,
  addMessageToSession,
  getSessionsByIp,
  destroySession,
  clearAllSessionsForIp,
  extractSessionId,
  setSessionCookie,
  clearSessionCookie,
  type UserSession,
} from "./sessionStore";
import {
  findAnswer,
  FALLBACK_ANSWER_EN,
  FALLBACK_ANSWER_HI,
  FALLBACK_ANSWER_HINGLISH,
  isDevanagari,
} from "../src/components/qaKnowledgeBase";

// ─── RAG Pipeline Imports ─────────────────────────────────────────────────────
import { detectLanguage, type DetectedLanguage } from "../src/services/languageDetector";
import { classifyQuery, getDomainLabel, type AgriDomain } from "../src/services/agricultureClassifier";
import { runGuardrails } from "../src/services/safetyGuardrails";
import { isPmKisanQuery } from "../src/services/pmKisanIntent";
import {
  getOrCreateContext,
  recordTurn,
  enrichQueryWithContext,
  getConversationHistory,
} from "../src/services/conversationContext";
import {
  ragGenerate,
  initializeEmbeddings,
  areEmbeddingsReady,
} from "./ragEngine";
import {
  getActiveModelName,
  setActiveModelName,
  checkOllamaHealth,
} from "./ollamaClient";
import {
  runFullIngestion,
  isIngestionRunning,
  getIngestionProgress,
  getLastIngestionResult,
  ingestSingleUrl,
  ingestRawText,
} from "./ingestionPipeline";
import {
  getVectorStoreStats,
  getAllChunks,
  getChunkCount,
} from "./vectorStore";

// ─── Initialize RAG Embeddings at Startup ─────────────────────────────────────
initializeEmbeddings().catch((err) =>
  console.warn("[RAG] Startup embedding failed:", err?.message)
);
function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      // Protection against large body payloads
      if (body.length > 500000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: any,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

/**
 * Main API Request Dispatcher for /api/*
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void,
): Promise<void> {
  const host = req.headers.host || "localhost:8443";
  const url = new URL(req.url || "/", `http://${host}`);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api")) {
    if (next) next();
    return;
  }

  const clientIp = extractClientIp(req);
  const method = req.method?.toUpperCase() || "GET";
  const isHttps = req.headers["x-forwarded-proto"] === "https";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Client-IP, X-Session-Id, Cookie",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Healthcheck: GET /api/health
    // -------------------------------------------------------------------------
    if (pathname === "/api/health" && method === "GET") {
      const rateStatus = await checkRateLimit(clientIp);
      sendJson(res, 200, {
        status: "ok",
        service: "Chhattisgarh Agriculture AI Assistant API",
        uptimeSeconds: Math.floor(process.uptime()),
        clientIp: maskIpForPrivacy(clientIp),
        storageEngine: rateStatus.storeType,
        rateLimitPolicy: {
          maxQueries: RATE_LIMIT_MAX_QUERIES,
          windowSeconds: 60,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 2. Rate Limit Status: GET /api/ratelimit
    // -------------------------------------------------------------------------
    if (pathname === "/api/ratelimit" && method === "GET") {
      const rateStatus = await checkRateLimit(clientIp);
      applyRateLimitHeaders(res, rateStatus);
      sendJson(res, 200, rateStatus);
      return;
    }

    // -------------------------------------------------------------------------
    // 3. Reset Rate Limit Quota (Demo/Testing): POST /api/ratelimit/reset
    // -------------------------------------------------------------------------
    if (pathname === "/api/ratelimit/reset" && method === "POST") {
      await resetRateLimitForIp(clientIp);
      const rateStatus = await checkRateLimit(clientIp);
      applyRateLimitHeaders(res, rateStatus);
      sendJson(res, 200, {
        success: true,
        message: `Query quota reset on server for IP: ${maskIpForPrivacy(clientIp)}`,
        status: rateStatus,
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 4. Session Routes:
    //    - GET /api/session: Get or create active session
    //    - POST /api/session/new: Start fresh session
    //    - GET /api/sessions: List session history for IP
    //    - DELETE /api/session: End active session
    // -------------------------------------------------------------------------
    if (pathname === "/api/session" && method === "GET") {
      const sessionId = extractSessionId(req);
      let session: UserSession | null = sessionId ? getSession(sessionId) : null;

      if (!session) {
        session = createSession(clientIp, "en");
        setSessionCookie(res, session.sessionId, isHttps);
      }

      sendJson(res, 200, { session });
      return;
    }

    if (pathname === "/api/session/new" && method === "POST") {
      const body = await parseRequestBody(req);
      const lang = body.lang === "hi" ? "hi" : "en";
      const newSession = createSession(clientIp, lang, body.title);
      setSessionCookie(res, newSession.sessionId, isHttps);
      sendJson(res, 201, { session: newSession });
      return;
    }

    if (pathname === "/api/sessions" && method === "GET") {
      const userSessions = getSessionsByIp(clientIp);
      sendJson(res, 200, {
        sessions: userSessions,
        clientIp: maskIpForPrivacy(clientIp),
      });
      return;
    }

    if (pathname === "/api/session" && method === "DELETE") {
      const sessionId = extractSessionId(req);
      if (sessionId) {
        destroySession(sessionId);
      }
      clearSessionCookie(res);
      sendJson(res, 200, { success: true, message: "Session ended" });
      return;
    }

    if (pathname === "/api/sessions" && method === "DELETE") {
      clearAllSessionsForIp(clientIp);
      clearSessionCookie(res);
      sendJson(res, 200, { success: true, message: "All sessions cleared" });
      return;
    }

    // -------------------------------------------------------------------------
    // 5. Main Chat & Query Endpoint: POST /api/chat (and POST /api/query)
    //    ENFORCES:
    //    - Input validation
    //    - IP-Based Query Rate Limiting (5 queries / 60 seconds)
    //    - HTTP 429 Too Many Requests response with friendly messages
    //    - Secure session binding & consultation transcript storage
    // -------------------------------------------------------------------------
    if ((pathname === "/api/chat" || pathname === "/api/query") && method === "POST") {
      // 1. IP-BASED RATE LIMIT ENFORCEMENT
      const rateLimitResult = await consumeRateLimit(clientIp);
      applyRateLimitHeaders(res, rateLimitResult);

      if (!rateLimitResult.allowed) {
        // HTTP 429 Too Many Requests with friendly message
        sendJson(res, 429, {
          error: "Too Many Requests",
          message: `Query rate limit reached. Each IP is allowed up to 5 chatbot queries per minute. Please wait ${rateLimitResult.retryAfterSeconds}s before asking another question.`,
          messageHi: `प्रति IP अनुरोध सीमा (5 प्रश्न प्रति मिनट) समाप्त हो गई है। कृपया पुनः प्रयास करने के लिए ${rateLimitResult.retryAfterSeconds} सेकंड प्रतीक्षा करें।`,
          ip: rateLimitResult.maskedIp,
          retryAfter: rateLimitResult.retryAfterSeconds,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        });
        return;
      }

      // 2. INPUT VALIDATION
      const body = await parseRequestBody(req);
      const rawQuestion = body.question;

      if (!rawQuestion || typeof rawQuestion !== "string" || !rawQuestion.trim()) {
        sendJson(res, 400, {
          error: "Bad Request",
          message: "Please enter a valid agriculture question.",
          messageHi: "कृपया एक वैध कृषि प्रश्न दर्ज करें।",
        });
        return;
      }

      if (rawQuestion.length > 1000) {
        sendJson(res, 400, {
          error: "Bad Request",
          message: "Question exceeds maximum length of 1000 characters.",
        });
        return;
      }

      const rawQ = rawQuestion.trim();

      // ── STAGE 1: Language Detection ───────────────────────────────────────
      const langDetection = detectLanguage(rawQ);
      const detectedLang: DetectedLanguage = langDetection.language;

      // Map detected language to session lang (hinglish → "en" for session)
      const sessionLang: "en" | "hi" = detectedLang === "hi" ? "hi" : "en";

      // ── STAGE 2: Safety Guardrails ────────────────────────────────────────
      const guardrailResult = runGuardrails(rawQ, detectedLang);

      if (guardrailResult.action === "block") {
        sendJson(res, 200, {
          success: true,
          answer: guardrailResult.response,
          guardrail: { triggered: true, reason: guardrailResult.reason },
          detectedLang,
          rateLimit: {
            allowed: rateLimitResult.allowed,
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit,
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
            ip: rateLimitResult.maskedIp,
          },
        });
        return;
      }

      // Use PII-redacted query for processing, but show original text in UI
      const safeQuery = guardrailResult.safeQuery ?? rawQ;

      // ── STAGE 3: Secure Session Resolution ───────────────────────────────
      let sessionId = extractSessionId(req) || body.sessionId;
      let session: UserSession | null = sessionId ? getSession(sessionId) : null;

      if (!session) {
        session = createSession(clientIp, sessionLang);
        setSessionCookie(res, session.sessionId, isHttps);
      }

      // ── STAGE 4: Conversation Context & Query Enrichment ──────────────────
      const ctx = getOrCreateContext(session.sessionId);
      const classification = classifyQuery(safeQuery, detectedLang);
      const domain = classification.isAgricultural ? classification.domain : undefined;
      const domainLabel = domain ? getDomainLabel(domain, detectedLang) : null;

      // Record user turn in context
      recordTurn(session.sessionId, {
        role: "user",
        text: safeQuery,
        detectedLang,
        domain: domain as AgriDomain | undefined,
      });

      // Enrich follow-up queries with context
      const enrichedQuery = enrichQueryWithContext(safeQuery, ctx);
      const conversationHistory = getConversationHistory(ctx, 6);

      // ── STAGE 5: Append User Message to Session Store ─────────────────────
      addMessageToSession(session.sessionId, {
        role: "user",
        text: rawQ, // Store original (not enriched) query
      });

      // ── STAGE 6: Guardrail Warning Response (bypass RAG for warn action) ──
      if (guardrailResult.action === "warn" && guardrailResult.response) {
        const updateResult = addMessageToSession(session.sessionId, {
          role: "assistant",
          text: guardrailResult.response,
        });
        recordTurn(session.sessionId, {
          role: "assistant",
          text: guardrailResult.response,
          detectedLang,
        });
        sendJson(res, 200, {
          success: true,
          answer: guardrailResult.response,
          guardrail: { triggered: true, reason: guardrailResult.reason },
          detectedLang,
          domain,
          domainLabel,
          session: updateResult?.session || session,
          rateLimit: {
            allowed: rateLimitResult.allowed,
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit,
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
            ip: rateLimitResult.maskedIp,
          },
        });
        return;
      }

      // ── STAGE 7: RAG Pipeline (Retrieval + Ollama Generation) ─────────────
      // Fallback answers based on detected language (guarantee official website reference)
      const fallbackAnswer =
        detectedLang === "hi" || isDevanagari(rawQ)
          ? FALLBACK_ANSWER_HI
          : detectedLang === "hinglish"
          ? FALLBACK_ANSWER_HINGLISH
          : FALLBACK_ANSWER_EN;
      let answerText: string;
      let sources: Array<{ title: string; url: string; department: string }> = [];
      let usedRag = false;
      let retrievalMethod: string = "hybrid";
      let ragModelUsed: string | undefined = undefined;
      let evalCount: number | undefined = undefined;
      let evalDurationMs: number | undefined = undefined;
      let generationDurationMs: number | undefined = undefined;

      const pmKisanQuery = isPmKisanQuery(safeQuery);
      const queryDomain = (pmKisanQuery ? "government_schemes" : domain) as AgriDomain | undefined;

      try {
        // ALWAYS execute RAG generation (retrieval + Ollama model synthesis)
        const ragResult = await ragGenerate(
          enrichedQuery,
          detectedLang,
          queryDomain,
          conversationHistory,
          fallbackAnswer,
          safeQuery,
          body.model
        );

        answerText = ragResult.answer;
        sources = ragResult.sources;
        usedRag = ragResult.usedOllama;
        retrievalMethod = ragResult.retrievalMethod;
        ragModelUsed = ragResult.modelUsed;
        evalCount = ragResult.evalCount;
        evalDurationMs = ragResult.evalDurationMs;
        generationDurationMs = ragResult.generationDurationMs;

        if (pmKisanQuery && sources.length === 0) {
          sources = [{ title: "PM-KISAN Official Portal", url: "https://pmkisan.gov.in", department: "Ministry of Agriculture & Farmers Welfare" }];
        }
      } catch (ragErr: any) {
        // RAG failed: fall back to rule-based QA
        console.warn("[API] RAG failed, falling back to rule-based QA:", ragErr.message);
        const match = findAnswer(safeQuery, sessionLang);
        answerText = match ? match.answer : fallbackAnswer;
        if (match?.source) {
          sources = [{ title: match.source.title, url: match.source.url ?? "", department: match.source.department }];
        }
        retrievalMethod = "rule_based";
      }

      // ── STAGE 8: Append Assistant Response to Session ─────────────────────
      const primarySource = sources[0] as { title: string; department: string; url?: string } | undefined;
      const updateResult = addMessageToSession(session.sessionId, {
        role: "assistant",
        text: answerText,
        source: primarySource,
      });

      // Record assistant turn in conversation context
      recordTurn(session.sessionId, {
        role: "assistant",
        text: answerText,
        detectedLang,
      });

      const currentModelName = ragModelUsed || (await getActiveModelName());

      // ── STAGE 9: Return Response ──────────────────────────────────────────
      sendJson(res, 200, {
        success: true,
        answer: answerText,
        sources,
        source: primarySource,
        domain,
        domainLabel,
        detectedLang,
        classification: {
          domain: classification.domain,
          confidence: classification.confidence,
          matchedKeywords: classification.matchedKeywords.slice(0, 5),
        },
        retrieval: {
          method: retrievalMethod,
          chunksUsed: sources.length,
          usedOllama: usedRag,
          embeddingsReady: areEmbeddingsReady(),
          modelUsed: currentModelName,
          evalCount,
          evalDurationMs,
          generationDurationMs,
        },
        guardrail: {
          triggered: guardrailResult.action !== "pass",
          piiRedacted: guardrailResult.action === "redact",
        },
        session: updateResult?.session || session,
        rateLimit: {
          allowed: rateLimitResult.allowed,
          remaining: rateLimitResult.remaining,
          limit: rateLimitResult.limit,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
          ip: rateLimitResult.maskedIp,
        },
      });
      return;
    }

    // ── Model Management Endpoints ───────────────────────────────────────────
    if (pathname === "/api/models" && method === "GET") {
      const health = await checkOllamaHealth();
      const active = await getActiveModelName();
      sendJson(res, 200, {
        available: health.available,
        models: health.models,
        activeModel: active,
        recommended: "qwen3:8b",
      });
      return;
    }

    if (pathname === "/api/model/switch" && method === "POST") {
      const body = await parseRequestBody(req);
      if (!body.model || typeof body.model !== "string") {
        sendJson(res, 400, { error: "Missing or invalid 'model' parameter" });
        return;
      }
      setActiveModelName(body.model.trim());
      const newActive = await getActiveModelName();
      sendJson(res, 200, {
        success: true,
        activeModel: newActive,
      });
      return;
    }

    // ── RAG Status Endpoint: GET /api/rag/status ───────────────────────────
    if (pathname === "/api/rag/status" && method === "GET") {
      const active = await getActiveModelName();
      sendJson(res, 200, {
        embeddingsReady: areEmbeddingsReady(),
        knowledgeBaseSize: 18,
        vectorStoreChunks: getChunkCount(),
        ollamaModel: active,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── Ingestion Status Endpoint: GET /api/ingest/status ───────────────────
    if (pathname === "/api/ingest/status" && method === "GET") {
      const isRunning = isIngestionRunning();
      const progress = getIngestionProgress();
      const lastResult = getLastIngestionResult();
      const stats = getVectorStoreStats();

      sendJson(res, 200, {
        running: isRunning,
        progress,
        lastResult,
        stats,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── Trigger Ingestion Pipeline: POST /api/ingest/run ─────────────────────
    if (pathname === "/api/ingest/run" && method === "POST") {
      if (isIngestionRunning()) {
        sendJson(res, 409, {
          success: false,
          message: "Ingestion pipeline is already currently running.",
          progress: getIngestionProgress(),
        });
        return;
      }

      const sync = url.searchParams.get("sync") === "true";

      if (sync) {
        // Wait for full ingestion
        const result = await runFullIngestion();
        sendJson(res, 200, {
          success: result.success,
          result,
          stats: getVectorStoreStats(),
        });
        return;
      } else {
        // Run in background and return immediate 202
        runFullIngestion().catch((err) =>
          console.error("[API] Background ingestion error:", err)
        );

        sendJson(res, 202, {
          success: true,
          message: "Government ingestion pipeline started in background. Query /api/ingest/status for live progress.",
          statusUrl: "/api/ingest/status",
        });
        return;
      }
    }

    // ── Ingest Specific URL (Web or PDF): POST /api/ingest/url ───────────────
    if (pathname === "/api/ingest/url" && method === "POST") {
      const body = await parseRequestBody(req);
      const targetUrl = body.url?.trim();
      const domain = body.domain?.trim() || "government_schemes";
      const title = body.title?.trim();

      if (!targetUrl || !targetUrl.startsWith("http")) {
        sendJson(res, 400, {
          success: false,
          error: "Invalid or missing 'url' parameter (must start with http/https).",
        });
        return;
      }

      const result = await ingestSingleUrl(targetUrl, domain, title);
      sendJson(res, result.success ? 200 : 500, {
        ...result,
        totalInStore: getChunkCount(),
      });
      return;
    }

    // ── Ingest Raw Text: POST /api/ingest/text ───────────────────────────────
    if (pathname === "/api/ingest/text" && method === "POST") {
      const body = await parseRequestBody(req);
      const text = body.text?.trim();
      const domain = body.domain?.trim() || "government_schemes";
      const title = body.title?.trim() || "Manual Document Entry";
      const sourceUrl = body.sourceUrl?.trim() || "manual://user-entry";

      if (!text || text.length < 50) {
        sendJson(res, 400, {
          success: false,
          error: "'text' must be at least 50 characters long.",
        });
        return;
      }

      const result = await ingestRawText(text, domain, title, sourceUrl);
      sendJson(res, result.success ? 200 : 500, {
        ...result,
        totalInStore: getChunkCount(),
      });
      return;
    }

    // ── Vector Store Stats: GET /api/ingest/stats ────────────────────────────
    if (pathname === "/api/ingest/stats" && method === "GET") {
      const stats = getVectorStoreStats();
      sendJson(res, 200, { success: true, stats });
      return;
    }

    // ── Inspect Chunks: GET /api/ingest/chunks ───────────────────────────────
    if (pathname === "/api/ingest/chunks" && method === "GET") {
      const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20", 10));
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      const domain = url.searchParams.get("domain") || undefined;

      const all = getAllChunks();
      const filtered = domain ? all.filter((c) => c.domain === domain) : all;
      const paginated = filtered.slice(offset, offset + limit).map((c) => ({
        id: c.id,
        title: c.sourceTitle,
        url: c.sourceUrl,
        domain: c.domain,
        contextHeader: c.contextHeader,
        preview: c.text.slice(0, 150) + "...",
        charCount: c.charCount,
        addedAt: c.addedAt,
      }));

      sendJson(res, 200, {
        total: filtered.length,
        limit,
        offset,
        chunks: paginated,
      });
      return;
    }

    sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });
  } catch (err: any) {
    console.error("[API Error]", err);
    sendJson(res, 500, {
      error: "Internal Server Error",
      message: err?.message || "An unexpected error occurred.",
    });
  }
}
