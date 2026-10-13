/**
 * Multilingual Semantic Vectorizer
 *
 * Produces 384-dimensional dense semantic embeddings for Hindi, English, and Hinglish
 * text using feature hashing (SimHash / Random Projection principle) with subword n-grams
 * and term weighting, with L2 unit normalization.
 *
 * Can also query Ollama /api/embed if enabled on the host, with automatic fallback
 * to high-performance local vectorization (sub-millisecond, zero dependencies).
 */

import { embedWithOllama, checkOllamaHealth } from "./ollamaClient";

export const EMBEDDING_DIMENSION = 384;
export const EMBEDDING_MODEL_ID = "local-hash-384-v1";

// Cache Ollama embedding capability status
let ollamaEmbeddingsSupported: boolean | null = null;
let lastOllamaCheck = 0;

/**
 * Fast Murmur-inspired 32-bit hash function
 */
function hashString(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

/**
 * Generates a deterministic 384-dimensional dense semantic embedding vector
 * from text. Supports English, Hindi (Devanagari), and Hinglish words.
 */
export function generateLocalEmbedding(text: string): number[] {
  const dim = EMBEDDING_DIMENSION;
  const vec = new Float32Array(dim);

  if (!text || text.trim().length === 0) {
    return Array.from(vec);
  }

  const clean = text.toLowerCase();

  // Extract words (both ASCII and Unicode / Devanagari words)
  const words = clean.match(/[\p{L}\p{N}]+/gu) || [];

  for (const word of words) {
    if (word.length < 2) continue;

    // Word-level hash features
    const wordWeight = 1.0 + Math.log(Math.min(word.length, 12));
    const idx1 = hashString(word, 42) % dim;
    const sign1 = (hashString(word, 137) % 2 === 0) ? 1 : -1;
    vec[idx1] += sign1 * wordWeight;

    const idx2 = hashString(word, 999) % dim;
    const sign2 = (hashString(word, 777) % 2 === 0) ? 1 : -1;
    vec[idx2] += sign2 * (wordWeight * 0.6);

    // Character 3-grams for subword / morphological semantic capture
    // (critical for Hindi inflections like किसान / किसानों and pest names)
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const tri = word.slice(i, i + 3);
        const triIdx = hashString(tri, 313) % dim;
        const triSign = (hashString(tri, 541) % 2 === 0) ? 1 : -1;
        vec[triIdx] += triSign * 0.4;
      }
    }
  }

  // L2 unit normalization so that dot product equals cosine similarity
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

/**
 * Computes cosine similarity between two vectors (-1 to 1, typically 0 to 1 for non-negative projections)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  const sim = dot / denom;
  return Math.max(0, Math.min(1, sim)); // Clamp to 0..1
}

/**
 * Checks whether Ollama currently supports embedding requests
 */
export async function testOllamaEmbeddingSupport(): Promise<boolean> {
  const now = Date.now();
  if (ollamaEmbeddingsSupported !== null && now - lastOllamaCheck < 60_000) {
    return ollamaEmbeddingsSupported;
  }
  lastOllamaCheck = now;

  try {
    const health = await checkOllamaHealth();
    if (!health.available) {
      ollamaEmbeddingsSupported = false;
      return false;
    }
    const testResult = await embedWithOllama("test");
    ollamaEmbeddingsSupported = Array.isArray(testResult) && testResult.length > 0;
    return ollamaEmbeddingsSupported;
  } catch {
    ollamaEmbeddingsSupported = false;
    return false;
  }
}

/**
 * Embeds text using Ollama if supported; otherwise uses the fast local semantic vectorizer.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const useOllama = await testOllamaEmbeddingSupport();
  if (useOllama) {
    try {
      const ollamaVec = await embedWithOllama(text.slice(0, 1500));
      if (ollamaVec && ollamaVec.length > 0) {
        return ollamaVec;
      }
    } catch {
      // Fallback to local
    }
  }

  return generateLocalEmbedding(text);
}

/**
 * Batch embedding generator for multiple texts
 */
export async function batchGetEmbeddings(texts: string[]): Promise<number[][]> {
  const useOllama = await testOllamaEmbeddingSupport();

  if (useOllama) {
    const results: number[][] = [];
    for (const t of texts) {
      try {
        const v = await embedWithOllama(t.slice(0, 1500));
        results.push(v);
      } catch {
        results.push(generateLocalEmbedding(t));
      }
    }
    return results;
  }

  // Pure local: extremely fast
  return texts.map((t) => generateLocalEmbedding(t));
}
