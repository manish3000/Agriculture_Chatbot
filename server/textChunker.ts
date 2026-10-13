/**
 * Text Chunker — Splits long documents into embeddable chunks
 *
 * Agriculture-aware chunking:
 * - Splits by paragraphs / section headings / bullet lists
 * - Preserves complete sentences (no mid-sentence cuts)
 * - Adds contextual headers to each chunk for Anthropic-style "Contextual Retrieval"
 * - Supports Hindi (Devanagari) paragraph boundaries
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextChunk {
  id: string;
  text: string;
  contextHeader: string;  // Contextual info prepended for embedding
  index: number;          // Chunk position in source document
  totalChunks: number;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  charCount: number;
}

export interface ChunkOptions {
  maxChunkSize: number;    // Max characters per chunk (default: 800)
  overlapSize: number;     // Overlap between consecutive chunks (default: 100)
  minChunkSize: number;    // Min characters for a valid chunk (default: 80)
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Partial<ChunkOptions> = {
  maxChunkSize: 800,
  overlapSize: 100,
  minChunkSize: 80,
};

// ─── Section / Paragraph Splitter ─────────────────────────────────────────────

/**
 * Splits text into logical paragraphs/sections:
 * 1. Double newlines (paragraph boundaries)
 * 2. Heading patterns (lines starting with #, •, numbered lists)
 * 3. Hindi section markers (।।, ─── etc.)
 */
function splitIntoSections(text: string): string[] {
  // Split on double newlines first (most reliable paragraph boundary)
  const rawSections = text.split(/\n{2,}/);

  const sections: string[] = [];

  for (const raw of rawSections) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    // If this section is too long, further split by single newlines
    // but only at heading/bullet boundaries
    if (trimmed.length > 1200) {
      const subSections = trimmed.split(/\n(?=[•\-\d]+\.|[#]+\s|[A-Z][\w\s]{5,}:)/);
      for (const sub of subSections) {
        const s = sub.trim();
        if (s.length > 0) sections.push(s);
      }
    } else {
      sections.push(trimmed);
    }
  }

  return sections;
}

// ─── Generate Chunk ID ────────────────────────────────────────────────────────

function generateChunkId(
  sourceUrl: string,
  sourceTitle: string,
  index: number
): string {
  // Create a URL-safe ID from the source
  const urlPart = sourceUrl
    .replace(/https?:\/\//, "")
    .replace(/[^\w]/g, "_")
    .slice(0, 40);
  const titlePart = sourceTitle.replace(/[^\w]/g, "_").slice(0, 32);

  return `scraped_${urlPart}_${titlePart}_chunk${index}`;
}

function splitOverlongText(text: string, maxSize: number): string[] {
  const parts: string[] = [];
  let remaining = text.trim();
  while (remaining.length > maxSize) {
    let splitAt = remaining.lastIndexOf(" ", maxSize);
    if (splitAt < Math.floor(maxSize * 0.6)) splitAt = maxSize;
    parts.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

// ─── Main Chunker ─────────────────────────────────────────────────────────────

/**
 * Chunks a long text into overlapping, contextually-rich chunks.
 * Each chunk gets a contextual header for improved retrieval.
 */
export function chunkText(
  text: string,
  options: ChunkOptions
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSize = opts.maxChunkSize!;
  const overlap = opts.overlapSize!;
  const minSize = opts.minChunkSize!;

  if (!text || text.trim().length < minSize) {
    return [];
  }

  // Step 1: Split into logical sections
  const sections = splitIntoSections(text);

  // Step 2: Merge small sections / split large ones into chunks
  const chunks: string[] = [];
  let currentChunk = "";

  for (const section of sections) {
    // If adding this section would exceed max, save current and start new
    if (currentChunk.length + section.length + 2 > maxSize) {
      if (currentChunk.length >= minSize) {
        chunks.push(currentChunk.trim());
      }

      // If the section itself is too large, split it by sentences
      if (section.length > maxSize) {
        const sentences = splitBySentences(section).flatMap((sentence) =>
          sentence.length > maxSize ? splitOverlongText(sentence, maxSize) : [sentence]
        );
        let sentenceChunk = "";

        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 > maxSize) {
            if (sentenceChunk.length >= minSize) {
              chunks.push(sentenceChunk.trim());
            }
            sentenceChunk = sentence;
          } else {
            sentenceChunk += (sentenceChunk ? " " : "") + sentence;
          }
        }
        if (sentenceChunk.length >= minSize) {
          chunks.push(sentenceChunk.trim());
        }
        currentChunk = "";
      } else {
        currentChunk = section;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + section;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length >= minSize) {
    chunks.push(currentChunk.trim());
  }

  // Step 3: Apply overlap between chunks
  const overlappedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let chunkText = chunks[i];

    // Prepend overlap from previous chunk
    if (i > 0 && overlap > 0) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-Math.min(overlap, maxSize - 4));
      const currentBudget = Math.max(1, maxSize - overlapText.length - 4);
      chunkText = `...${overlapText} ${chunkText.slice(0, currentBudget)}`;
    }

    overlappedChunks.push(chunkText);
  }

  // Step 4: Build TextChunk objects with contextual headers
  const totalChunks = overlappedChunks.length;

  return overlappedChunks.map((chunkContent, index) => {
    const contextHeader = buildContextHeader(
      opts.sourceTitle,
      opts.sourceDomain,
      index + 1,
      totalChunks
    );

    return {
      id: generateChunkId(opts.sourceUrl, opts.sourceTitle, index),
      text: chunkContent,
      contextHeader,
      index,
      totalChunks,
      sourceUrl: opts.sourceUrl,
      sourceDomain: opts.sourceDomain,
      sourceTitle: opts.sourceTitle,
      charCount: chunkContent.length,
    };
  });
}

// ─── Sentence Splitter ────────────────────────────────────────────────────────

/**
 * Splits text by sentence boundaries (supports Hindi full stops too)
 */
function splitBySentences(text: string): string[] {
  // Split at English periods, Hindi purna viram, and numbered list items
  const sentences = text.split(
    /(?<=[.!?\u0964।])\s+(?=[A-Z\u0900-\u097F\d•\-])/
  );

  return sentences.filter((s) => s.trim().length > 0);
}

// ─── Contextual Header (Anthropic-style Contextual Retrieval) ─────────────────

/**
 * Builds a contextual header to prepend to each chunk.
 * This improves retrieval accuracy by giving the embedder context
 * about what document/section this chunk belongs to.
 */
function buildContextHeader(
  title: string,
  domain: string,
  chunkNum: number,
  totalChunks: number
): string {
  const domainLabels: Record<string, string> = {
    government_schemes: "Government Agriculture Scheme",
    crop_insurance: "Crop Insurance (PMFBY)",
    soil_and_fertilizer: "Soil Health & Fertilizer",
    helpline_and_emergency: "Farmer Helpline",
    market_and_msp: "Agriculture Market & MSP",
    farmer_registration: "Farmer Registration",
    kisan_credit_and_loans: "Kisan Credit & Loans",
    organic_farming: "Organic Farming",
    crop_guidance: "Crop Advisory",
    pest_and_disease: "Pest & Disease Management",
    irrigation_and_water: "Irrigation & Water Management",
    horticulture: "Horticulture",
    seeds_and_sowing: "Seeds & Sowing",
    machinery_and_tools: "Farm Machinery",
    weather_and_climate: "Weather & Climate",
    training_and_institutes: "Training & KVK",
  };

  const domainLabel = domainLabels[domain] || "Agriculture";

  return `[Source: ${title}] [Category: ${domainLabel}] [Chunk ${chunkNum}/${totalChunks}]`;
}

// ─── Batch Chunker ────────────────────────────────────────────────────────────

export interface DocumentToChunk {
  text: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
}

/**
 * Chunks multiple documents and returns all chunks with unique IDs.
 */
export function chunkDocuments(
  documents: DocumentToChunk[],
  maxChunkSize: number = 800,
  overlapSize: number = 100
): TextChunk[] {
  const allChunks: TextChunk[] = [];

  for (const doc of documents) {
    if (!doc.text || doc.text.trim().length < 80) continue;

    const chunks = chunkText(doc.text, {
      maxChunkSize,
      overlapSize,
      minChunkSize: 80,
      sourceUrl: doc.sourceUrl,
      sourceDomain: doc.sourceDomain,
      sourceTitle: doc.sourceTitle,
    });

    allChunks.push(...chunks);
  }

  console.log(
    `[Chunker] ${documents.length} documents → ${allChunks.length} chunks`
  );

  return allChunks;
}
