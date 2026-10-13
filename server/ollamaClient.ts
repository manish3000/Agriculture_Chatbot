/**
 * Ollama API Client
 * Handles communication with Ollama running at http://localhost:11434
 * Supports: text generation (qwen2.5:latest) and embeddings (/api/embed)
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
let activeModelName: string = process.env.OLLAMA_MODEL || "qwen3:8b";
let cachedHealth: { available: boolean; models: string[]; timestamp: number } | null = null;

export function setActiveModelName(model: string): void {
  activeModelName = model;
  console.log(`[Ollama] Active model explicitly set to: ${model}`);
}

export async function getActiveModelName(): Promise<string> {
  // If explicitly configured via env or setter, prioritize that
  if (activeModelName) return activeModelName;
  try {
    const health = await checkOllamaHealth();
    if (health.available && health.models.length > 0) {
      if (health.models.includes("qwen3:8b")) {
        activeModelName = "qwen3:8b";
      } else {
        activeModelName = health.models[0];
      }
      return activeModelName;
    }
  } catch {}
  return "qwen3:8b";
}

// Timeout removed per user request: no time limit for answer generation
const EMBED_TIMEOUT_MS = 30_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaGenerateOptions {
  model?: string;
  temperature?: number;
  num_predict?: number;
  num_ctx?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  signal?: AbortSignal;
}

export interface OllamaEmbedResult {
  embedding: number[];
  model: string;
}

export interface OllamaGenerateResult {
  text: string;
  model: string;
  done: boolean;
  totalDurationMs?: number;
  loadDurationMs?: number;
  evalDurationMs?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Checks if Ollama is reachable and the model is available
 */
export async function checkOllamaHealth(): Promise<{
  available: boolean;
  models: string[];
  error?: string;
}> {
  // If we verified health within last 30 seconds, return cached status to avoid blocking during generation
  if (cachedHealth && cachedHealth.available && Date.now() - cachedHealth.timestamp < 30_000) {
    return { available: cachedHealth.available, models: cachedHealth.models };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { available: false, models: [], error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name);

    cachedHealth = { available: true, models, timestamp: Date.now() };
    return {
      available: true,
      models,
    };
  } catch (err: any) {
    return {
      available: false,
      models: [],
      error: err?.message || "Ollama not reachable",
    };
  }
}

// ─── Text Generation ──────────────────────────────────────────────────────────

/**
 * Generates a response using Ollama chat API with conversation history.
 * Optimized for local inference with 4096 context, 256 predict, and keep_alive.
 */
export async function generateWithOllama(
  messages: OllamaMessage[],
  options: OllamaGenerateOptions = {}
): Promise<OllamaGenerateResult> {
  try {
    const model = options.model || (await getActiveModelName());
    const body = {
      model,
      messages,
      stream: false,
      keep_alive: "30m", // Keep model in RAM between requests to eliminate reload latency
      options: {
        temperature: options.temperature ?? 0.2, // 0.2 for factual, non-hallucinatory output
        num_predict: options.num_predict ?? 256, // 256 max tokens for concise, fast farmer answers
        num_ctx: options.num_ctx ?? 4096,        // 4096-token context window
        top_p: options.top_p ?? 0.85,
        top_k: options.top_k ?? 40,
        repeat_penalty: options.repeat_penalty ?? 1.15,
      },
    };

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal, // Only aborts if caller explicitly passes an abort signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // Clean any thinking tags from the output so user receives clean answer
    let rawText = data.message?.content || data.response || "";
    let cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // If content was empty or only thinking tags, fall back to thinking content or raw text
    if (!cleanText && data.message?.thinking) {
      cleanText = String(data.message.thinking).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }
    if (!cleanText) {
      cleanText = rawText.trim();
    }

    return {
      text: cleanText,
      model: data.model || model,
      done: data.done ?? true,
      totalDurationMs: data.total_duration
        ? Math.round(data.total_duration / 1_000_000)
        : undefined,
      loadDurationMs: data.load_duration
        ? Math.round(data.load_duration / 1_000_000)
        : undefined,
      evalDurationMs: data.eval_duration
        ? Math.round(data.eval_duration / 1_000_000)
        : undefined,
      promptEvalCount: data.prompt_eval_count,
      evalCount: data.eval_count,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Generation was cancelled.");
    }
    throw err;
  }
}

// ─── Embedding Generation ─────────────────────────────────────────────────────

/**
 * Generates embeddings for a text using Ollama /api/embed endpoint.
 * Uses qwen2.5:latest which supports multilingual embeddings.
 */
export async function embedWithOllama(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const model = await getActiveModelName();
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama embed error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // Ollama /api/embed returns { embeddings: [[...]] }
    if (data.embeddings && data.embeddings.length > 0) {
      return data.embeddings[0] as number[];
    }

    // Fallback: older format returns { embedding: [...] }
    if (data.embedding) {
      return data.embedding as number[];
    }

    throw new Error("Ollama returned no embedding data.");
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      throw new Error("Ollama embedding timed out after 30 seconds.");
    }
    throw err;
  }
}

/**
 * Batch embed multiple texts (sequentially to avoid overloading Ollama)
 */
export async function batchEmbedWithOllama(
  texts: string[]
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const embedding = await embedWithOllama(text);
    results.push(embedding);
  }
  return results;
}
