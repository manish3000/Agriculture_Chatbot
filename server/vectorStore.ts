/**
 * Persistent Vector Store
 *
 * Stores chunk embeddings on disk as JSON so they survive server restarts.
 * Provides:
 * - Persistent storage at server/data/vectorStore.json
 * - Fast hybrid cosine similarity + BM25 keyword search
 * - Automatic local embedding calculation if chunks have empty vectors
 * - CRUD operations for chunks
 */

import fs from "node:fs";
import path from "node:path";
import { EMBEDDING_MODEL_ID, generateLocalEmbedding, cosineSimilarity } from "./vectorizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredChunk {
  id: string;
  text: string;
  contextHeader: string;
  domain: string;
  sourceUrl: string;
  sourceTitle: string;
  embedding: number[];
  embeddingModel?: string;
  addedAt: string;       // ISO timestamp
  charCount: number;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface VectorSearchResult {
  chunk: StoredChunk;
  score: number;         // Combined hybrid score (0–1)
  semanticScore?: number;
  bm25Score?: number;
}

export interface VectorStoreStats {
  totalChunks: number;
  domains: Record<string, number>;
  embeddingDimensions: number;
  embeddingModels: Record<string, number>;
  lastUpdated: string;
  fileSizeKB: number;
  sources: Array<{ title: string; url: string; count: number }>;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve("server", "data");
const STORE_PATH = path.join(DATA_DIR, "vectorStore.json");
const METADATA_PATH = path.join(DATA_DIR, "vectorStoreMeta.json");
const OFFICIAL_PDF_SOURCES: Record<string, { url: string; title: string; domain: string }> = {
  "pm_kisan_official_faqs.pdf": {
    url: "https://pmkisan.gov.in/Documents/FAQPMKISAN.PDF",
    title: "PM-KISAN Official Frequently Asked Questions & Guidelines",
    domain: "government_schemes",
  },
  "pm_kisan_operational_guidelines.pdf": {
    url: "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf",
    title: "PM-KISAN Revised Operational Guidelines (DAC&FW)",
    domain: "government_schemes",
  },
  "pm_kisan_scheme_details.pdf": {
    url: "https://pmkisan.gov.in/Documents/PMKisanSamanNidhi.PDF",
    title: "Pradhan Mantri Kisan Samman Nidhi Scheme Norms & Objectives",
    domain: "government_schemes",
  },
  "nfsm_guidelines_fy_2025_2026.pdf": {
    url: "https://nfsm.gov.in/Guidelines/NFSNM%20GUIDELINES%20APPROVED%20FY%202025-2026.pdf",
    title: "National Food Security & Nutrition Mission (NFSNM) Guidelines FY 2025-26",
    domain: "government_schemes",
  },
  "cg_agriculture_vision.pdf": {
    url: "https://agriportal.cg.nic.in/PDF/Vision/Vision.PDF",
    title: "Chhattisgarh Agriculture Vision & Mandi Board Policy",
    domain: "government_schemes",
  },
};

// ─── In-Memory Store + Disk Persistence ───────────────────────────────────────

let chunks: Map<string, StoredChunk> = new Map();
let storeLoaded = false;
let lastSavedAt = 0;

// ─── Ensure data directory ────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[VectorStore] Created data directory: ${DATA_DIR}`);
  }
}

// ─── Load from Disk ───────────────────────────────────────────────────────────

/**
 * Loads the vector store from disk on startup.
 */
export function loadVectorStore(force = false): void {
  ensureDataDir();

  if (storeLoaded && !force) return;

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed: StoredChunk[] = JSON.parse(raw);

      let migratedEmbeddings = false;
      // Persistent vectors must share the named embedding space used at query time.
      for (const c of parsed) {
        if (c.embeddingModel !== EMBEDDING_MODEL_ID || !c.embedding || c.embedding.length !== 384) {
          c.embedding = generateLocalEmbedding(`${c.contextHeader} ${c.text}`);
          c.embeddingModel = EMBEDDING_MODEL_ID;
          migratedEmbeddings = true;
        }
        const localFileName = path.basename(c.sourceUrl).toLowerCase();
        const officialSource = OFFICIAL_PDF_SOURCES[localFileName];
        if (officialSource && c.sourceUrl !== officialSource.url) {
          c.sourceUrl = officialSource.url;
          c.sourceTitle = officialSource.title;
          c.domain = officialSource.domain;
          migratedEmbeddings = true;
        }
      }

      chunks = new Map(parsed.map((c) => [c.id, c]));

      console.log(
        `[VectorStore] Loaded ${chunks.size} chunks from disk (${STORE_PATH})`
      );
      storeLoaded = true;
      if (migratedEmbeddings) {
        console.warn(`[VectorStore] Normalized stored vectors/source metadata to ${EMBEDDING_MODEL_ID}`);
        forceSaveVectorStore();
      }
    } else {
      console.log("[VectorStore] No existing store found. Starting fresh.");
      chunks = new Map();
    }
  } catch (err: any) {
    console.error("[VectorStore] Failed to load:", err.message);
    chunks = new Map();
  }

  storeLoaded = true;
}

/**
 * Force reload store from disk
 */
export function reloadVectorStore(): void {
  loadVectorStore(true);
}

// ─── Save to Disk ─────────────────────────────────────────────────────────────

/**
 * Persists the current vector store to disk.
 * Debounced: won't save more often than every 2 seconds.
 */
export function saveVectorStore(): void {
  ensureDataDir();

  const now = Date.now();
  if (now - lastSavedAt < 2000) return; // Debounce
  lastSavedAt = now;

  try {
    const allChunks = Array.from(chunks.values());
    const json = JSON.stringify(allChunks, null, 0); // Compact format

    fs.writeFileSync(STORE_PATH, json, "utf-8");

    // Save metadata
    const meta = {
      totalChunks: allChunks.length,
      embeddingModel: EMBEDDING_MODEL_ID,
      lastUpdated: new Date().toISOString(),
      fileSizeKB: Math.round(Buffer.byteLength(json) / 1024),
    };
    fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2), "utf-8");

    console.log(
      `[VectorStore] Saved ${allChunks.length} chunks to disk (${meta.fileSizeKB} KB)`
    );
  } catch (err: any) {
    console.error("[VectorStore] Save failed:", err.message);
  }
}

/**
 * Forces synchronous save to disk.
 */
export function forceSaveVectorStore(): void {
  lastSavedAt = 0;
  saveVectorStore();
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Adds a chunk with its embedding to the store.
 */
export function addChunk(chunk: StoredChunk): void {
  if (!storeLoaded) loadVectorStore();

  if (!chunk.embedding || chunk.embedding.length === 0 || chunk.embeddingModel !== EMBEDDING_MODEL_ID) {
    chunk.embedding = generateLocalEmbedding(`${chunk.contextHeader} ${chunk.text}`);
  }
  chunk.embeddingModel = EMBEDDING_MODEL_ID;

  chunks.set(chunk.id, chunk);
}

/**
 * Adds multiple chunks at once (batch insert).
 */
export function addChunks(newChunks: StoredChunk[]): number {
  if (!storeLoaded) loadVectorStore();

  let added = 0;
  for (const chunk of newChunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) {
      chunk.embedding = generateLocalEmbedding(`${chunk.contextHeader} ${chunk.text}`);
    }
    if (chunk.embeddingModel !== EMBEDDING_MODEL_ID) {
      chunk.embedding = generateLocalEmbedding(`${chunk.contextHeader} ${chunk.text}`);
      chunk.embeddingModel = EMBEDDING_MODEL_ID;
    }
    chunks.set(chunk.id, chunk);
    added++;
  }

  if (added > 0) {
    saveVectorStore();
  }

  return added;
}

/**
 * Removes a chunk by ID.
 */
export function removeChunk(id: string): boolean {
  if (!storeLoaded) loadVectorStore();
  const removed = chunks.delete(id);
  if (removed) saveVectorStore();
  return removed;
}

/**
 * Removes all chunks from a specific source URL.
 */
export function removeChunksBySource(sourceUrl: string): number {
  if (!storeLoaded) loadVectorStore();
  let removed = 0;
  for (const [id, chunk] of chunks.entries()) {
    if (chunk.sourceUrl === sourceUrl) {
      chunks.delete(id);
      removed++;
    }
  }
  if (removed > 0) saveVectorStore();
  return removed;
}

/**
 * Returns a chunk by ID.
 */
export function getChunk(id: string): StoredChunk | undefined {
  if (!storeLoaded) loadVectorStore();
  return chunks.get(id);
}

/**
 * Returns all stored chunks.
 */
export function getAllChunks(): StoredChunk[] {
  if (!storeLoaded) loadVectorStore();
  return Array.from(chunks.values());
}

/**
 * Returns total count of stored chunks.
 */
export function getChunkCount(): number {
  if (!storeLoaded) loadVectorStore();
  return chunks.size;
}

// ─── Keyword (BM25-Lite) Scoring ──────────────────────────────────────────────

function bm25Score(query: string, chunkText: string): number {
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const textLower = chunkText.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (textLower.includes(token)) {
      score += token.length;
    }
  }

  return Math.min(1.0, score / 100);
}

// ─── Semantic Hybrid Search ───────────────────────────────────────────────────

/**
 * Searches the vector store using hybrid cosine similarity + BM25 keyword scoring.
 */
export function searchVectorStore(
  queryEmbedding: number[],
  queryText: string,
  topK: number = 5,
  domainFilter?: string,
  sourceUrlIncludes?: string
): VectorSearchResult[] {
  if (!storeLoaded) loadVectorStore();

  // If query embedding not provided, compute local embedding
  const effectiveEmbedding =
    queryEmbedding && queryEmbedding.length > 0
      ? queryEmbedding
      : generateLocalEmbedding(queryText);

  const BM25_WEIGHT = 0.35;
  const SEMANTIC_WEIGHT = 0.65;
  const results: VectorSearchResult[] = [];

  for (const chunk of chunks.values()) {
    if (domainFilter && chunk.domain !== domainFilter) continue;
    if (sourceUrlIncludes && !chunk.sourceUrl.toLowerCase().includes(sourceUrlIncludes.toLowerCase())) continue;

    // Ensure chunk has embedding
    if (!chunk.embedding || chunk.embedding.length === 0 || chunk.embeddingModel !== EMBEDDING_MODEL_ID) {
      chunk.embedding = generateLocalEmbedding(`${chunk.contextHeader} ${chunk.text}`);
      chunk.embeddingModel = EMBEDDING_MODEL_ID;
    }

    const compatibleEmbedding = effectiveEmbedding.length === chunk.embedding.length;
    const semanticScore = compatibleEmbedding ? cosineSimilarity(effectiveEmbedding, chunk.embedding) : 0;
    const keywordScore = bm25Score(queryText, `${chunk.text} ${chunk.contextHeader}`);

    const combined = compatibleEmbedding
      ? semanticScore * SEMANTIC_WEIGHT + keywordScore * BM25_WEIGHT
      : keywordScore;

    if (combined > 0.03) {
      results.push({
        chunk,
        score: combined,
        semanticScore,
        bm25Score: keywordScore,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * BM25-only search fallback.
 */
export function searchByKeywords(
  queryText: string,
  topK: number = 5,
  domainFilter?: string,
  sourceUrlIncludes?: string
): VectorSearchResult[] {
  if (!storeLoaded) loadVectorStore();

  const results: VectorSearchResult[] = [];

  for (const chunk of chunks.values()) {
    if (domainFilter && chunk.domain !== domainFilter) continue;
    if (sourceUrlIncludes && !chunk.sourceUrl.toLowerCase().includes(sourceUrlIncludes.toLowerCase())) continue;

    const score = bm25Score(queryText, `${chunk.text} ${chunk.contextHeader}`);
    if (score > 0.02) {
      results.push({ chunk, score, bm25Score: score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getVectorStoreStats(): VectorStoreStats {
  if (!storeLoaded) loadVectorStore();

  const domains: Record<string, number> = {};
  const embeddingDimensions: Record<number, number> = {};
  const embeddingModels: Record<string, number> = {};
  const sourceMap = new Map<string, { title: string; url: string; count: number }>();

  for (const chunk of chunks.values()) {
    domains[chunk.domain] = (domains[chunk.domain] || 0) + 1;
    if (chunk.embedding.length > 0) embeddingDimensions[chunk.embedding.length] = (embeddingDimensions[chunk.embedding.length] || 0) + 1;
    const model = chunk.embeddingModel || "unknown";
    embeddingModels[model] = (embeddingModels[model] || 0) + 1;

    const srcKey = chunk.sourceUrl || "unknown";
    const existing = sourceMap.get(srcKey);
    if (existing) {
      existing.count++;
    } else {
      sourceMap.set(srcKey, {
        title: chunk.sourceTitle || "Untitled",
        url: chunk.sourceUrl || "",
        count: 1,
      });
    }
  }

  let fileSizeKB = 0;
  let lastUpdated = "unknown";
  try {
    if (fs.existsSync(STORE_PATH)) {
      const stat = fs.statSync(STORE_PATH);
      fileSizeKB = Math.round(stat.size / 1024);
    }
    if (fs.existsSync(METADATA_PATH)) {
      lastUpdated = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8")).lastUpdated || "unknown";
    }
  } catch {}

  return {
    totalChunks: chunks.size,
    domains,
    embeddingDimensions: Object.keys(embeddingDimensions).length === 1 ? Number(Object.keys(embeddingDimensions)[0]) : 0,
    embeddingModels,
    lastUpdated,
    fileSizeKB,
    sources: Array.from(sourceMap.values()),
  };
}

/**
 * Clears the entire vector store.
 */
export function clearVectorStore(): void {
  chunks = new Map();
  storeLoaded = true;
  forceSaveVectorStore();
  console.log("[VectorStore] Cleared all chunks");
}
