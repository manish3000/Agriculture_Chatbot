/**
 * RAG Engine — Hybrid Retrieval (BM25 keyword + Ollama Semantic Embeddings)
 *
 * Pipeline:
 * 1. At startup: embed all knowledge base chunks using Ollama qwen2.5
 * 2. At query time: embed query, compute cosine similarity
 * 3. Combine with BM25 keyword score for hybrid retrieval
 * 4. Return top-K chunks as context for LLM generation
 */

import { KNOWLEDGE_BASE, type KBChunk } from "./knowledgeBase";
import { embedWithOllama, generateWithOllama, checkOllamaHealth, type OllamaMessage } from "./ollamaClient";
import type { DetectedLanguage } from "../src/services/languageDetector";
import type { AgriDomain } from "../src/services/agricultureClassifier";
import {
  loadVectorStore,
  searchVectorStore,
  searchByKeywords,
  getChunkCount,
} from "./vectorStore";
import { generateLocalEmbedding, cosineSimilarity as vectorCosineSimilarity } from "./vectorizer";
import { isPmKisanQuery } from "../src/services/pmKisanIntent";

// ─── Config ───────────────────────────────────────────────────────────────────

const TOP_K = 3;           // Number of chunks to retrieve per query
const BM25_WEIGHT = 0.35;  // Weight for BM25 keyword score
const SEM_WEIGHT = 0.65;   // Weight for semantic similarity score
const MIN_COMBINED_SCORE = 0.05; // Minimum score to include a chunk

function redactDiagnosticText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/g, "[PHONE]")
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[AADHAAR]")
    .replace(/((?:account|a\/c|bank)[^\n]{0,30}?\b)\d{8,18}\b/gi, "$1[ACCOUNT]")
    .replace(/https?:\/\/[^\s)]+/g, (value) => {
      try {
        const url = new URL(value);
        url.username = "";
        url.password = "";
        url.search = "";
        url.hash = "";
        return url.toString().replace(/\/$/, "");
      } catch {
        return "[URL]";
      }
    });
}

// ─── Embedding Store (in-memory) ─────────────────────────────────────────────

// Stores chunk embeddings keyed by chunk ID
const embeddingStore = new Map<string, number[]>();
let embeddingsReady = false;
let embeddingInProgress = false;

// ─── Cosine Similarity ────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── BM25 Keyword Scorer ──────────────────────────────────────────────────────

export function normalizeAgriQuery(text: string): string {
  let q = text.toLowerCase();
  q = q.replace(/\bkishan\b/g, "kisan");
  q = q.replace(/\bkisaan\b/g, "kisan");
  q = q.replace(/\bkissan\b/g, "kisan");
  q = q.replace(/\byojna\b/g, "yojana");
  q = q.replace(/\bphasal\b/g, "fasal");
  q = q.replace(/\bsaman\b/g, "samman");
  q = q.replace(/\baadhar\b/g, "aadhaar");
  return q;
}

/**
 * Lightweight BM25-inspired keyword scoring.
 * Scores a chunk based on keyword overlap and phrase matching with the query.
 */
function computeBM25Score(query: string, chunk: KBChunk): number {
  const rawQ = query.toLowerCase();
  const q = normalizeAgriQuery(rawQ);
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;

  // Score based on exact keyword phrase matches (high reward)
  for (const kw of chunk.keywords) {
    const kwLower = kw.toLowerCase();
    if (rawQ.includes(kwLower) || q.includes(kwLower)) {
      score += kwLower.length * 2.5;
    }
  }

  // Score based on title match
  const titleLower = (chunk.title + " " + chunk.titleHi).toLowerCase();
  if (titleLower.includes(q) || titleLower.includes(rawQ)) {
    score += 20.0;
  }
  for (const token of tokens) {
    if (token.length > 2 && titleLower.includes(token)) {
      score += token.length * 1.5;
    }
  }

  // Content token overlap
  const contentText = (chunk.content + " " + chunk.contentHi + " " + chunk.contentHinglish).toLowerCase();
  for (const token of tokens) {
    if (token.length > 3 && contentText.includes(token)) {
      score += token.length * 0.4;
    }
  }

  // Normalize: score of 40+ gives near 1.0 confidence
  const MAX_EXPECTED_SCORE = 45;
  return Math.min(1.0, score / MAX_EXPECTED_SCORE);
}

// ─── Embed All Chunks at Startup ─────────────────────────────────────────────

/**
 * Initializes embeddings for all knowledge base chunks.
 * Should be called once at server startup.
 * Falls back gracefully if Ollama is not available.
 */
export async function initializeEmbeddings(): Promise<void> {
  if (embeddingsReady || embeddingInProgress) return;
  embeddingInProgress = true;

  console.log(`[RAG] Initializing semantic vectors for ${KNOWLEDGE_BASE.length} knowledge base chunks...`);

  let embedded = 0;
  let failed = 0;

  for (const chunk of KNOWLEDGE_BASE) {
    try {
      const embeddingText = [
        chunk.title,
        chunk.titleHi,
        chunk.content.slice(0, 400),
        chunk.contentHi.slice(0, 200),
        chunk.keywords.join(", "),
      ].join(" | ");

      const embedding = generateLocalEmbedding(embeddingText);
      embeddingStore.set(chunk.id, embedding);
      embedded++;
      chunk.embedding = embedding;
    } catch (err: any) {
      console.error(`[RAG] Failed to embed chunk ${chunk.id}: ${err.message}`);
      failed++;
    }
  }

  embeddingsReady = embedded > 0;
  embeddingInProgress = false;

  console.log(
    `[RAG] Semantic vector initialization complete: ${embedded} chunks ready.`
  );
}

/**
 * Returns true if semantic embeddings are ready
 */
export function areEmbeddingsReady(): boolean {
  return embeddingsReady;
}

// ─── Hybrid Retrieval ─────────────────────────────────────────────────────────

export interface RetrievedChunk {
  chunk: KBChunk;
  score: number;       // Combined hybrid score
  bm25Score: number;
  semanticScore: number;
  contentKey: "content" | "contentHi" | "contentHinglish";
}

/**
 * Retrieves top-K most relevant chunks using hybrid BM25 + semantic scoring.
 */
export async function retrieveRelevantChunks(
  query: string,
  detectedLang: DetectedLanguage,
  preferredDomain?: AgriDomain,
  topK: number = TOP_K
): Promise<RetrievedChunk[]> {

  // ── Step 1: Compute BM25 scores for all chunks ──────────────────────────
  const bm25Scores = new Map<string, number>();
  for (const chunk of KNOWLEDGE_BASE) {
    bm25Scores.set(chunk.id, computeBM25Score(query, chunk));
  }

  // ── Step 2: Compute semantic similarity (if embeddings ready) ────────────
  const semanticScores = new Map<string, number>();

  if (embeddingsReady) {
    try {
      const queryEmbedding = generateLocalEmbedding(query);
      for (const chunk of KNOWLEDGE_BASE) {
        const chunkEmbedding = embeddingStore.get(chunk.id);
        if (chunkEmbedding) {
          semanticScores.set(
            chunk.id,
            vectorCosineSimilarity(queryEmbedding, chunkEmbedding)
          );
        } else {
          semanticScores.set(chunk.id, 0);
        }
      }
    } catch (err: any) {
      console.warn("[RAG] Semantic scoring failed, using BM25 only:", err.message);
      for (const chunk of KNOWLEDGE_BASE) {
        semanticScores.set(chunk.id, 0);
      }
    }
  } else {
    // No embeddings: fall back to BM25 only
    for (const chunk of KNOWLEDGE_BASE) {
      semanticScores.set(chunk.id, 0);
    }
  }

  // ── Step 3: Combine scores + domain boost ────────────────────────────────
  const scored: Array<{
    chunk: KBChunk;
    combined: number;
    bm25: number;
    semantic: number;
  }> = [];

  // Determine highest BM25 match across knowledge base
  let maxBM25 = 0;
  for (const chunk of KNOWLEDGE_BASE) {
    const b = bm25Scores.get(chunk.id) ?? 0;
    if (b > maxBM25) maxBM25 = b;
  }

  for (const chunk of KNOWLEDGE_BASE) {
    const bm25 = bm25Scores.get(chunk.id) ?? 0;
    const semantic = semanticScores.get(chunk.id) ?? 0;

    let combined = 0;
    if (maxBM25 > 0.15) {
      // Direct keyword matches exist: BM25 must dominate over approximate hashes
      combined = bm25 * 0.75 + semantic * 0.25;
      if (bm25 > 0.2) combined += 0.25; // Priority boost for keyword matches
    } else {
      // Exploratory query without exact keyword hits: balanced
      combined = bm25 * 0.4 + semantic * 0.6;
    }

    // Domain alignment boost (if we know the predicted domain)
    if (preferredDomain && chunk.domain === preferredDomain) {
      combined *= 1.3;
    }

    if (combined >= MIN_COMBINED_SCORE) {
      scored.push({ chunk, combined, bm25, semantic });
    }
  }

  // ── Step 4: Sort and return top-K ────────────────────────────────────────
  scored.sort((a, b) => b.combined - a.combined);
  const topChunks = scored.slice(0, topK);

  // Map language to content key
  const contentKey: "content" | "contentHi" | "contentHinglish" =
    detectedLang === "hi"
      ? "contentHi"
      : detectedLang === "hinglish"
      ? "contentHinglish"
      : "content";

  return topChunks.map(({ chunk, combined, bm25, semantic }) => ({
    chunk,
    score: combined,
    bm25Score: bm25,
    semanticScore: semantic,
    contentKey,
  }));
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Builds the agriculture-specific system prompt for Ollama generation
 */
function buildSystemPrompt(lang: DetectedLanguage, domain?: AgriDomain): string {
  const langInstruction =
    lang === "hi"
      ? "ALWAYS respond in Hindi (Devanagari script). Never switch to English or Roman script."
      : lang === "hinglish"
      ? "ALWAYS respond in conversational Hinglish (Roman script Hindi mixed with simple English terms). Keep it natural, like how Indian farmers speak."
      : "ALWAYS respond in simple, clear English. Avoid overly technical jargon.";

  return `You are a farmer-support assistant for the Chhattisgarh Agriculture Department.

ANSWERING RULES:
1. Answer the exact user question directly in 2–5 short sentences.
2. Use only relevant evidence from the retrieved context.
3. For seed-price questions, accept only evidence explicitly containing seed prices or applicable seed-rate tables.
4. NEVER confuse MSP (Minimum Support Price for harvested crops) with seed purchase prices.
5. NEVER use KCC loan interest rates as seed prices.
6. Do not infer a price from a subsidy announcement or a general scheme description.
7. If the exact price is unavailable, clearly state that the retrieved documents do not specify it.
8. When available, provide an official department source, source date, and practical verification step.
9. Do not invent prices, URLs, subsidies, or eligibility rules.
10. Do not reveal internal reasoning, planning, source-by-source analysis, or phrases such as "First, I need to check."

OUTPUT:
Answer: [Direct answer]
Price: [Verified price and unit, or "Not available in retrieved sources"]
Source: [Official source and date, if available]
Next step: [One useful action if the price is unavailable]

Keep the answer concise and farmer-friendly.

LANGUAGE RULE: ${langInstruction}${domain ? `\n\nFOCUS DOMAIN: ${domain}` : ""}`;
}

export function isNoAnswerResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("don't have") ||
    lower.includes("do not have") ||
    lower.includes("does not contain") ||
    lower.includes("not mentioned in the context") ||
    lower.includes("not provided in the context") ||
    lower.includes("cannot find") ||
    lower.includes("do not know") ||
    lower.includes("no information available") ||
    lower.includes("cannot answer") ||
    lower.includes("unable to answer") ||
    lower.includes("not in the provided context") ||
    lower.includes("cannot be verified") ||
    lower.includes("do not establish") ||
    lower.includes("does not establish") ||
    lower.includes("do not specify") ||
    lower.includes("does not specify") ||
    lower.includes("not available in retrieved sources") ||
    lower.includes("not available in retrieved") ||
    lower.includes("not specified in retrieved") ||
    lower.includes("जानकारी उपलब्ध नहीं") ||
    lower.includes("मेरे पास यह जानकारी नहीं") ||
    lower.includes("संदर्भ में नहीं") ||
    lower.includes("सत्यापित नहीं") ||
    lower.includes("jankari uplabdh nahi") ||
    lower.includes("nahi pata")
  );
}

export function appendOfficialWebsiteGuidance(
  answer: string,
  lang: DetectedLanguage,
  domain?: AgriDomain
): string {
  if (answer.includes("https://") || answer.includes("http://")) {
    return answer;
  }

  const isHorticulture = domain === "horticulture";
  const isPMKisan =
    domain === "government_schemes" ||
    answer.toLowerCase().includes("kisan") ||
    answer.toLowerCase().includes("किसान");
  const portalUrl = isHorticulture
    ? "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx"
    : isPMKisan
    ? "https://pmkisan.gov.in"
    : "https://agriportal.cg.nic.in";

  if (lang === "hi") {
    return `${answer}\n\n🌐 **कृपया आधिकारिक वेबसाइट देखें:**\n• ${portalUrl}\n• कृषि एवं किसान कल्याण मंत्रालय: https://agricoop.nic.in\n📞 किसान कॉल सेंटर (टोल-फ्री): 1800-180-1551`;
  } else if (lang === "hinglish") {
    return `${answer}\n\n🌐 **Kripya official website check karein:**\n• ${portalUrl}\n• Ministry of Agriculture: https://agricoop.nic.in\n📞 Kisan Call Center (Toll-Free): 1800-180-1551`;
  } else {
    return `${answer}\n\n🌐 **Please check the official website:**\n• Portal: ${portalUrl}\n• Ministry of Agriculture & Farmers Welfare: https://agricoop.nic.in\n📞 Kisan Call Center (Toll Free): 1800-180-1551`;
  }
}

// ─── Full RAG Generation Pipeline ────────────────────────────────────────────

export interface RAGResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    department: string;
  }>;
  retrievedChunks: RetrievedChunk[];
  retrievalMethod: "hybrid" | "bm25_only" | "fallback";
  domain?: AgriDomain;
  usedOllama: boolean;
  modelUsed?: string;
  generationDurationMs?: number;
  evalCount?: number;
  evalDurationMs?: number;
}

/**
 * Main RAG pipeline: retrieve relevant chunks → generate answer with Ollama
 */
export async function ragGenerate(
  query: string,
  detectedLang: DetectedLanguage,
  domain: AgriDomain | undefined,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  fallbackAnswer: string,
  originalQuery: string = query,
  modelOverride?: string
): Promise<RAGResult> {

  // ── Step 1a: Retrieve from static KB ──────────────────────────────────────
  let staticChunks: RetrievedChunk[] = [];
  let retrievalMethod: "hybrid" | "bm25_only" | "fallback" = "fallback";

  try {
    staticChunks = await retrieveRelevantChunks(query, detectedLang, domain);
    retrievalMethod = embeddingsReady ? "hybrid" : "bm25_only";
  } catch (err: any) {
    console.warn("[RAG] Static KB retrieval failed:", err.message);
  }

  // ── Step 1b: Retrieve from persistent vector store (scraped/PDF) ──────────
  let vectorStoreContext: string[] = [];
  const vectorSources: Array<{ title: string; url: string; department: string }> = [];
  let vectorMatches: ReturnType<typeof searchVectorStore> = [];
  const isPMKisanQuery = isPmKisanQuery(query);

  try {
    loadVectorStore();
    const vsCount = getChunkCount();

    if (vsCount > 0) {
      const queryEmbedding = generateLocalEmbedding(query);
      const vsResults = searchVectorStore(
        queryEmbedding,
        query,
        isPMKisanQuery ? 12 : 4,
        domain || undefined,
        isPMKisanQuery ? "pmkisan.gov.in" : undefined
      );
      vectorMatches = vsResults;

      for (const vr of vsResults) {
        vectorStoreContext.push(
          `[Source: ${vr.chunk.sourceTitle}]\n${vr.chunk.contextHeader}\n${vr.chunk.text}`
        );
        vectorSources.push({
          title: vr.chunk.sourceTitle,
          url: vr.chunk.sourceUrl,
          department: "Scraped/Ingested Source",
        });
      }

      if (vsResults.length > 0) {
        console.log(
          `[RAG] Vector store returned ${vsResults.length} chunks (from ${vsCount} total)`
        );
      }

      if (process.env.RAG_DIAGNOSTICS === "1") {
        const keywordMatches = searchByKeywords(
          query,
          5,
          domain || undefined,
          isPMKisanQuery ? "pmkisan.gov.in" : undefined
        );
        console.info("[RAG:retrieval]", JSON.stringify({
          originalQuery: redactDiagnosticText(originalQuery),
          rewrittenQuery: redactDiagnosticText(query),
          vector: vsResults.map((result, rank) => ({
            rank: rank + 1,
            id: result.chunk.id,
            title: redactDiagnosticText(result.chunk.sourceTitle),
            sourceUrl: redactDiagnosticText(result.chunk.sourceUrl),
            chunkIndex: result.chunk.chunkIndex,
            score: result.score,
            cosineSimilarity: result.semanticScore,
            keywordScore: result.bm25Score,
            text: redactDiagnosticText(result.chunk.text.slice(0, 500)),
          })),
          keyword: keywordMatches.map((result, rank) => ({
            rank: rank + 1,
            id: result.chunk.id,
            title: redactDiagnosticText(result.chunk.sourceTitle),
            sourceUrl: redactDiagnosticText(result.chunk.sourceUrl),
            score: result.score,
            text: redactDiagnosticText(result.chunk.text.slice(0, 500)),
          })),
        }));
      }
    }
  } catch (err: any) {
    console.warn("[RAG] Vector store retrieval failed:", err.message);
  }

  // ── Step 2: Build context from both sources ───────────────────────────────
  const contentKey =
    detectedLang === "hi"
      ? "contentHi"
      : detectedLang === "hinglish"
      ? "contentHinglish"
      : "content";

  const staticContextBlocks = staticChunks.map((r, i) => {
    const content = r.chunk[contentKey] || r.chunk.content;
    const srcTitle = r.chunk.source.title;
    return {
      text: `[Source ${i + 1}: ${srcTitle} | ${r.chunk.source.url}]\n${content}`,
      title: srcTitle,
      url: r.chunk.source.url,
      score: r.score,
    };
  });

  const vectorContextBlocks = vectorMatches.map((result) => ({
    text: `[Source: ${result.chunk.sourceTitle} | ${result.chunk.sourceUrl}]\n${result.chunk.contextHeader}\n${result.chunk.text}`,
    title: result.chunk.sourceTitle,
    url: result.chunk.sourceUrl,
    score: result.score,
  }));
  const allContextBlocks = isPMKisanQuery
    ? [
        ...vectorContextBlocks,
        ...staticContextBlocks.filter(
          (b) =>
            b.title.toLowerCase().includes("kisan") ||
            b.title.toLowerCase().includes("scheme")
        ),
        ...staticContextBlocks,
      ]
    : [...staticContextBlocks, ...vectorContextBlocks];

  // If no blocks scored above threshold, fallback to top knowledge base chunks so context is never empty
  if (allContextBlocks.length === 0 && KNOWLEDGE_BASE.length > 0) {
    const defaultChunks = KNOWLEDGE_BASE.slice(0, 3);
    for (const chunk of defaultChunks) {
      allContextBlocks.push({
        text: `[Source: ${chunk.source.title} | ${chunk.source.url}]\n${chunk[contentKey] || chunk.content}`,
        title: chunk.source.title,
        url: chunk.source.url,
        score: 0.1,
      });
    }
  }

  const focusedCandidates = allContextBlocks.slice(0, 3);
  const focusedBlocks = focusedCandidates.map((block) => block.text.slice(0, 1400));
  const contextString = focusedBlocks.join("\n\n---\n\n");

  // ── Step 3: Build Ollama messages ─────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(detectedLang, domain);

  const userPromptWithContext =
    focusedBlocks.length > 0
      ? `Verified Agriculture Context:\n${contextString}\n\nFarmer Question: ${query}\n(Answer concisely in 2-3 points based on the above context)`
      : `Farmer Question: ${query}`;

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    // Include only recent conversation history (last 2 turns)
    ...conversationHistory.slice(-2).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: userPromptWithContext },
  ];

  if (process.env.RAG_DIAGNOSTICS === "1") {
    console.info("[RAG:prompt]", JSON.stringify({
      systemPrompt: redactDiagnosticText(systemPrompt),
      context: redactDiagnosticText(contextString),
      userPrompt: redactDiagnosticText(userPromptWithContext),
      recentHistory: conversationHistory.slice(-2).map((message) => ({
        role: message.role,
        content: redactDiagnosticText(message.content),
      })),
      contextChars: contextString.length,
      selectedSources: focusedCandidates.map(({ title, url, score }) => ({
        title: redactDiagnosticText(title),
        url: redactDiagnosticText(url),
        score,
      })),
    }));
  }

  // ── Step 4: Generate with Ollama ──────────────────────────────────────────
  let answer = fallbackAnswer;
  let usedOllama = false;
  let modelUsed: string | undefined = undefined;
  let generationDurationMs: number | undefined = undefined;
  let evalCount: number | undefined = undefined;
  let evalDurationMs: number | undefined = undefined;

  try {
    const result = await generateWithOllama(messages, {
      model: modelOverride,
      temperature: 0.2,      // Low temp for factual accuracy
      num_predict: 256,      // 256 max tokens for concise, fact-grounded response
      repeat_penalty: 1.15,
    });

    modelUsed = result.model;
    generationDurationMs = result.totalDurationMs;
    evalCount = result.evalCount;
    evalDurationMs = result.evalDurationMs;

    if (result.text && result.text.trim().length > 10) {
      let candidate = result.text.trim();
      if (isNoAnswerResponse(candidate)) {
        candidate = appendOfficialWebsiteGuidance(candidate, detectedLang, domain);
      }
      answer = candidate;
      usedOllama = true;
      const totalChunks = staticChunks.length + vectorStoreContext.length;
      console.log(
        `[RAG] Generated answer via Ollama (${result.totalDurationMs}ms). ` +
        `Chunks: ${totalChunks} (${staticChunks.length} static + ${vectorStoreContext.length} ingested), Method: ${retrievalMethod}, Model: ${result.model}`
      );
    }
  } catch (err: any) {
    console.warn("[RAG] Ollama generation failed, using fallback:", err.message);
  }

  if (process.env.RAG_DIAGNOSTICS === "1") {
    console.info("[RAG:answer]", JSON.stringify({
      answer: redactDiagnosticText(answer),
      usedOllama,
      modelUsed,
      generationDurationMs,
      evidenceCount: focusedCandidates.length,
      sourceUrls: focusedCandidates.map((block) => redactDiagnosticText(block.url)),
    }));
  }

  // ── Step 5: Collect unique sources from both stores ────────────────────────
  const seenUrls = new Set<string>();
  const sources: Array<{ title: string; url: string; department: string }> = [];

  // Cite only sources whose chunks were actually included in the model context.
  for (const selected of focusedCandidates) {
    if (!seenUrls.has(selected.url)) {
      seenUrls.add(selected.url);
      sources.push({ title: selected.title, url: selected.url, department: "Official Retrieved Source" });
    }
  }

  // ── Step 4b: Fallback answer synthesis from verified chunks ─────────────
  if (!usedOllama && focusedCandidates.length > 0) {
    if (!isPMKisanQuery && staticChunks.length > 0) {
      const topStatic = staticChunks[0].chunk;
      const content =
        detectedLang === "hi"
          ? topStatic.contentHi
          : detectedLang === "hinglish"
          ? topStatic.contentHinglish
          : topStatic.content;

      const header =
        detectedLang === "hi"
          ? `📋 **सत्यापित सरकारी स्रोत से जानकारी (${topStatic.source.title}):**\n\n`
          : detectedLang === "hinglish"
          ? `📋 **Verified Government Scheme Information (${topStatic.source.title}):**\n\n`
          : `📋 **Verified Official Information (${topStatic.source.title}):**\n\n`;

      answer = `${header}${content}\n\n📞 किसान कॉल सेंटर (टोल-फ्री): 1800-180-1551\n🌐 आधिकारिक पोर्टल: ${topStatic.source.url}`;
    } else if (vectorContextBlocks.length > 0) {
      const topSrc = vectorSources[0];
      const previewText = focusedBlocks.slice(0, 2).join("\n\n");
      answer = `📋 **Verified Official Agriculture Record:**\n\n${previewText}\n\n📞 Kisan Call Center (Toll Free): 1800-180-1551\n🌐 Source: ${topSrc?.url || "Official Government Portal"}`;
    }
  }

  return {
    answer,
    sources,
    retrievedChunks: staticChunks,
    retrievalMethod,
    domain,
    usedOllama,
    modelUsed,
    generationDurationMs,
    evalCount,
    evalDurationMs,
  };
}
