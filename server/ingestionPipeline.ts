/**
 * Ingestion Pipeline — Master Orchestrator
 *
 * Full pipeline:
 * 1. Scrape verified government portals (webScraper.ts)
 * 2. Download and extract official government PDFs (pdfExtractor.ts)
 * 3. Extract any custom uploaded PDFs in server/data/pdfs/
 * 4. Chunk all text with Anthropic-style contextual headers (textChunker.ts)
 * 5. Embed chunks using Ollama if supported, or fast multilingual vectorizer (vectorizer.ts)
 * 6. Save persistent embeddings to server/data/vectorStore.json (vectorStore.ts)
 */

import { scrapeAllTargets, type ScrapedPage, SCRAPE_TARGETS, type ScrapeTarget } from "./webScraper";
import {
  downloadAndExtractGovPdfs,
  extractAllPdfsInDir,
  extractPdfFromUrl,
  type ExtractedPDF,
} from "./pdfExtractor";
import { chunkDocuments, type TextChunk, type DocumentToChunk } from "./textChunker";
import { EMBEDDING_MODEL_ID, generateLocalEmbedding } from "./vectorizer";
import {
  loadVectorStore,
  addChunks,
  removeChunksBySource,
  forceSaveVectorStore,
  getChunkCount,
  getVectorStoreStats,
  type StoredChunk,
} from "./vectorStore";
import { KNOWLEDGE_BASE, type KBChunk } from "./knowledgeBase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngestionProgress {
  stage: "idle" | "scraping_web" | "extracting_pdfs" | "chunking" | "embedding" | "completed" | "failed";
  progressPercent: number;
  message: string;
  currentDocument?: string;
  totalDocs?: number;
  totalChunks?: number;
  chunksProcessed?: number;
}

export interface IngestionResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;

  // Source stats
  webPagesScraped: number;
  webPagesSuccess: number;
  pdfsExtracted: number;
  pdfsSuccess: number;
  staticChunksIndexed: number;

  // Processing stats
  totalDocuments: number;
  totalChunks: number;
  chunksEmbedded: number;
  chunksStored: number;

  // Store summary
  totalInStore: number;

  // Errors
  errors: string[];
}

// ─── Ingestion State ──────────────────────────────────────────────────────────

let isIngesting = false;
let currentProgress: IngestionProgress = {
  stage: "idle",
  progressPercent: 0,
  message: "Ready",
};
let lastIngestionResult: IngestionResult | null = null;

export function isIngestionRunning(): boolean {
  return isIngesting;
}

export function getIngestionProgress(): IngestionProgress {
  return currentProgress;
}

export function getLastIngestionResult(): IngestionResult | null {
  return lastIngestionResult;
}

// ─── Convert Static KB Chunks → Documents ─────────────────────────────────────

function staticKBToDocuments(): DocumentToChunk[] {
  return KNOWLEDGE_BASE.map((kb) => ({
    text: [
      kb.content,
      kb.contentHi,
      kb.contentHinglish,
      `Keywords: ${kb.keywords.join(", ")}`,
    ].join("\n\n"),
    sourceUrl: kb.source.url,
    sourceDomain: kb.domain,
    sourceTitle: kb.title,
  }));
}

// ─── Convert Scraped Pages → Documents ────────────────────────────────────────

function scrapedToDocuments(pages: ScrapedPage[]): DocumentToChunk[] {
  return pages
    .filter((p) => p.success && p.text.length >= 80)
    .map((p) => ({
      text: p.text,
      sourceUrl: p.url,
      sourceDomain: p.domain,
      sourceTitle: p.title,
    }));
}

// ─── Convert Extracted PDFs → Documents ───────────────────────────────────────

function pdfsToDocuments(pdfs: ExtractedPDF[]): DocumentToChunk[] {
  return pdfs
    .filter((p) => p.success && p.text.length >= 80)
    .map((p) => ({
      text: p.text,
      sourceUrl: p.sourceUrl || p.filePath,
      sourceDomain: p.domain || "government_schemes",
      sourceTitle: p.title,
    }));
}

// ─── Embed Chunks ─────────────────────────────────────────────────────────────

async function embedChunks(
  textChunks: TextChunk[]
): Promise<{
  storedChunks: StoredChunk[];
  embedded: number;
  errors: string[];
}> {
  const storedChunks: StoredChunk[] = [];
  let embedded = 0;
  const errors: string[] = [];

  for (let i = 0; i < textChunks.length; i++) {
    const tc = textChunks[i];
    const embeddingText = `${tc.contextHeader} ${tc.text}`.slice(0, 1500);

    let embedding: number[] = [];
    try {
      embedding = generateLocalEmbedding(embeddingText);
      embedded++;
    } catch (err: any) {
      errors.push(`Embedding fallback error for ${tc.id}: ${err.message}`);
    }

    const stored: StoredChunk = {
      id: tc.id,
      text: tc.text,
      contextHeader: tc.contextHeader,
      domain: tc.sourceDomain,
      sourceUrl: tc.sourceUrl,
      sourceTitle: tc.sourceTitle,
      embedding,
      embeddingModel: EMBEDDING_MODEL_ID,
      addedAt: new Date().toISOString(),
      charCount: tc.charCount,
      chunkIndex: tc.index,
      totalChunks: tc.totalChunks,
    };

    storedChunks.push(stored);

    // Update progress
    if ((i + 1) % 15 === 0 || i === textChunks.length - 1) {
      const pct = Math.round(60 + ((i + 1) / textChunks.length) * 35);
      currentProgress = {
        stage: "embedding",
        progressPercent: pct,
        message: `Vectorizing chunks: ${i + 1}/${textChunks.length}`,
        totalChunks: textChunks.length,
        chunksProcessed: i + 1,
      };
      console.log(
        `[Ingestion] Embedding progress: ${i + 1}/${textChunks.length} chunks`
      );
    }
  }

  return { storedChunks, embedded, errors };
}

// ─── Full Ingestion Pipeline ──────────────────────────────────────────────────

/**
 * Runs the complete ingestion pipeline:
 * 1. Scrape verified government websites
 * 2. Download & extract official government PDFs
 * 3. Extract custom PDFs from upload directory
 * 4. Index static knowledge base
 * 5. Chunk all documents with Anthropic contextual headers
 * 6. Generate semantic vectors for all chunks
 * 7. Store in persistent vector store
 */
export async function runFullIngestion(): Promise<IngestionResult> {
  if (isIngesting) {
    return {
      success: false,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
      webPagesScraped: 0,
      webPagesSuccess: 0,
      pdfsExtracted: 0,
      pdfsSuccess: 0,
      staticChunksIndexed: 0,
      totalDocuments: 0,
      totalChunks: 0,
      chunksEmbedded: 0,
      chunksStored: 0,
      totalInStore: getChunkCount(),
      errors: ["Ingestion is already running"],
    };
  }

  isIngesting = true;
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const errors: string[] = [];

  try {
    currentProgress = {
      stage: "scraping_web",
      progressPercent: 10,
      message: "Scraping official government portals...",
    };

    console.log("[Ingestion] ═══════════════════════════════════════════");
    console.log("[Ingestion] Starting real government ingestion pipeline");
    console.log("[Ingestion] ═══════════════════════════════════════════");

    // ── Step 0: Load vector store ─────────────────────────────────────────────
    loadVectorStore();

    // ── Step 1: Scrape Government Websites ────────────────────────────────────
    console.log("\n[Ingestion] ── Step 1: Scraping government websites ──");
    let scrapedPages: ScrapedPage[] = [];
    try {
      scrapedPages = await scrapeAllTargets();
    } catch (err: any) {
      errors.push(`Web scraping failed: ${err.message}`);
      console.error("[Ingestion] Web scraping error:", err.message);
    }

    const webSuccess = scrapedPages.filter((p) => p.success).length;
    const scrapedDocs = scrapedToDocuments(scrapedPages);
    console.log(
      `[Ingestion] Scraped ${webSuccess}/${scrapedPages.length} pages → ${scrapedDocs.length} documents`
    );

    // ── Step 2: Download & Extract Official Government PDFs ───────────────────
    currentProgress = {
      stage: "extracting_pdfs",
      progressPercent: 35,
      message: "Downloading & extracting official government scheme PDFs...",
    };

    console.log("\n[Ingestion] ── Step 2: Downloading & extracting government PDFs ──");
    let govPdfs: ExtractedPDF[] = [];
    try {
      govPdfs = await downloadAndExtractGovPdfs();
    } catch (err: any) {
      errors.push(`Gov PDF extraction failed: ${err.message}`);
      console.error("[Ingestion] Gov PDF error:", err.message);
    }

    // Also extract any user-uploaded PDFs in server/data/pdfs/
    let localPdfs: ExtractedPDF[] = [];
    try {
      localPdfs = await extractAllPdfsInDir();
    } catch (err: any) {
      console.warn("[Ingestion] Local PDF extraction error:", err.message);
    }

    // Deduplicate by filePath
    const pdfMap = new Map<string, ExtractedPDF>();
    for (const p of [...govPdfs, ...localPdfs]) {
      if (!p.filePath) continue;
      const previous = pdfMap.get(p.filePath);
      if (!previous || (!previous.sourceUrl && p.sourceUrl)) pdfMap.set(p.filePath, p);
    }
    const allPdfs = Array.from(pdfMap.values());
    const pdfSuccess = allPdfs.filter((p) => p.success).length;
    const pdfDocs = pdfsToDocuments(allPdfs);

    console.log(
      `[Ingestion] Extracted ${pdfSuccess}/${allPdfs.length} PDFs → ${pdfDocs.length} documents`
    );

    // ── Step 3: Index Static Knowledge Base ───────────────────────────────────
    console.log("\n[Ingestion] ── Step 3: Indexing static knowledge base ──");
    const staticDocs = staticKBToDocuments();
    console.log(`[Ingestion] Added ${staticDocs.length} verified baseline entries`);

    // ── Step 4: Chunk All Documents ───────────────────────────────────────────
    currentProgress = {
      stage: "chunking",
      progressPercent: 55,
      message: "Splitting extracted documents into contextual chunks...",
    };

    console.log("\n[Ingestion] ── Step 4: Chunking all documents ──");
    const allDocs = [...staticDocs, ...scrapedDocs, ...pdfDocs];
    // Chunks of 800 chars with 100 chars overlap
    const textChunks = chunkDocuments(allDocs, 800, 100);
    console.log(
      `[Ingestion] ${allDocs.length} documents → ${textChunks.length} contextual chunks`
    );

    // ── Step 5: Embed & Vectorize ─────────────────────────────────────────────
    currentProgress = {
      stage: "embedding",
      progressPercent: 65,
      message: `Generating semantic vectors for ${textChunks.length} chunks...`,
      totalChunks: textChunks.length,
    };

    console.log("\n[Ingestion] ── Step 5: Generating semantic vectors & storing ──");
    const { storedChunks, embedded, errors: embedErrors } = await embedChunks(textChunks);
    errors.push(...embedErrors);

    // ── Step 6: Store in Persistent Vector Store ──────────────────────────────
    // Refresh only sources successfully extracted in this run. This removes stale
    // trailing chunks when a source becomes shorter while retaining failed sources.
    for (const sourceUrl of new Set(allDocs.map((doc) => doc.sourceUrl))) {
      removeChunksBySource(sourceUrl);
    }
    const storedCount = addChunks(storedChunks);
    forceSaveVectorStore();

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const totalInStore = getChunkCount();

    const result: IngestionResult = {
      success: storedCount > 0,
      startedAt,
      completedAt,
      durationMs,
      webPagesScraped: scrapedPages.length,
      webPagesSuccess: webSuccess,
      pdfsExtracted: allPdfs.length,
      pdfsSuccess: pdfSuccess,
      staticChunksIndexed: staticDocs.length,
      totalDocuments: allDocs.length,
      totalChunks: textChunks.length,
      chunksEmbedded: embedded,
      chunksStored: storedCount,
      totalInStore,
      errors,
    };

    lastIngestionResult = result;
    currentProgress = {
      stage: "completed",
      progressPercent: 100,
      message: `Ingestion complete! ${storedCount} chunks indexed into vector store.`,
      totalChunks: textChunks.length,
      chunksProcessed: textChunks.length,
    };

    console.log("\n[Ingestion] ═══════════════════════════════════════════");
    console.log(`[Ingestion] COMPLETE in ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`[Ingestion]   Web pages: ${webSuccess}/${scrapedPages.length} scraped`);
    console.log(`[Ingestion]   PDFs:      ${pdfSuccess}/${allPdfs.length} extracted`);
    console.log(`[Ingestion]   Chunks:    ${textChunks.length} created & vectorized`);
    console.log(`[Ingestion]   Total in store: ${totalInStore} chunks`);
    console.log("[Ingestion] ═══════════════════════════════════════════");

    return result;
  } catch (err: any) {
    console.error("[Ingestion] Fatal pipeline failure:", err);
    currentProgress = {
      stage: "failed",
      progressPercent: 0,
      message: `Ingestion failed: ${err.message}`,
    };
    errors.push(`Fatal error: ${err.message}`);

    const result: IngestionResult = {
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startMs,
      webPagesScraped: 0,
      webPagesSuccess: 0,
      pdfsExtracted: 0,
      pdfsSuccess: 0,
      staticChunksIndexed: 0,
      totalDocuments: 0,
      totalChunks: 0,
      chunksEmbedded: 0,
      chunksStored: 0,
      totalInStore: getChunkCount(),
      errors,
    };

    lastIngestionResult = result;
    return result;
  } finally {
    isIngesting = false;
  }
}

// ─── Ingest Single URL (Web Page or PDF) ──────────────────────────────────────

export async function ingestSingleUrl(
  url: string,
  domain: string = "government_schemes",
  title?: string
): Promise<{ success: boolean; chunksAdded: number; error?: string }> {
  try {
    loadVectorStore();

    let text = "";
    const displayTitle = title || url.split("/").pop() || "Custom Ingested Source";

    if (url.toLowerCase().endsWith(".pdf")) {
      const pdf = await extractPdfFromUrl(url, undefined, displayTitle, domain);
      if (!pdf.success) throw new Error(pdf.error || "PDF extraction failed");
      text = pdf.text;
    } else {
      const { scrapePage } = await import("./webScraper");
      const target: ScrapeTarget = {
        url,
        domain,
        description: displayTitle,
        selectors: ["main", ".content", "article", "p", "h1", "h2", "h3", "li"],
        excludeSelectors: ["nav", "header", "footer", "script", "style"],
      };
      const result = await scrapePage(target);
      if (!result.success) throw new Error(result.error || "Scraping failed");
      text = result.text;
    }

    const chunks = chunkDocuments([
      {
        text,
        sourceUrl: url,
        sourceDomain: domain,
        sourceTitle: displayTitle,
      },
    ]);

    if (chunks.length === 0) {
      throw new Error("Text produced no chunks (less than minimum length)");
    }

    const { storedChunks } = await embedChunks(chunks);
    // Replace any previous ingestion of this URL, including stale trailing chunks.
    removeChunksBySource(url);
    const stored = addChunks(storedChunks);
    forceSaveVectorStore();

    return { success: true, chunksAdded: stored };
  } catch (err: any) {
    return { success: false, chunksAdded: 0, error: err.message };
  }
}

// ─── Ingest Raw Text ──────────────────────────────────────────────────────────

export async function ingestRawText(
  text: string,
  domain: string = "government_schemes",
  title: string = "Manual Entry",
  sourceUrl: string = "manual://entry"
): Promise<{ success: boolean; chunksAdded: number; error?: string }> {
  try {
    loadVectorStore();

    const chunks = chunkDocuments([
      {
        text,
        sourceUrl,
        sourceDomain: domain,
        sourceTitle: title,
      },
    ]);

    if (chunks.length === 0) {
      throw new Error("Text is too short to produce chunks");
    }

    const { storedChunks } = await embedChunks(chunks);
    const stored = addChunks(storedChunks);
    forceSaveVectorStore();

    return { success: true, chunksAdded: stored };
  } catch (err: any) {
    return { success: false, chunksAdded: 0, error: err.message };
  }
}
