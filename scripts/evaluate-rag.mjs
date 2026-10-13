import fs from "node:fs";
import { createServer } from "vite";

const dataset = JSON.parse(fs.readFileSync("server/data/rag_eval.json", "utf8"));
const vite = await createServer({ configFile: "vite.config.ts", logLevel: "error", server: { middlewareMode: true } });

try {
  const store = await vite.ssrLoadModule("/server/vectorStore.ts");
  const vectorizer = await vite.ssrLoadModule("/server/vectorizer.ts");
  const classifier = await vite.ssrLoadModule("/src/services/agricultureClassifier.ts");
  const pmIntent = await vite.ssrLoadModule("/src/services/pmKisanIntent.ts");
  const chunker = await vite.ssrLoadModule("/server/textChunker.ts");
  store.loadVectorStore(true);
  const chunks = store.getAllChunks();
  const dimCounts = new Map();
  const modelCounts = new Map();
  for (const chunk of chunks) {
    dimCounts.set(chunk.embedding.length, (dimCounts.get(chunk.embedding.length) || 0) + 1);
    modelCounts.set(chunk.embeddingModel || "unknown", (modelCounts.get(chunk.embeddingModel || "unknown") || 0) + 1);
  }

  const rows = dataset.map((item) => {
    // Deterministic, generation-free retrieval checks over the production store.
    const embedding = vectorizer.generateLocalEmbedding(item.query);
    const classification = classifier.classifyQuery(item.query, item.language);
    const clarificationRequired = classifier.requiresSchemeClarification(item.query);
    const intent = item.category === "unanswerable" ? pmIntent.detectPmKisanIntent(item.query) : undefined;
    const baseline = store.searchVectorStore(embedding, item.query, 3, "government_schemes");
    const domain = item.category === "irrelevant" ? classification.domain : "government_schemes";
    const sourceScope = item.category === "relevant" ? "pmkisan.gov.in" : undefined;
    const scoped = clarificationRequired
      ? []
      : store.searchVectorStore(embedding, item.query, 3, domain, sourceScope);
    const keyword = clarificationRequired
      ? []
      : store.searchByKeywords(item.query, 3, domain, sourceScope);

    const sourceHit = !item.expectedSource || scoped.some((result) => result.chunk.sourceUrl.includes(item.expectedSource));
    const termsHit = !item.expectedTerms || item.expectedTerms.every((term) =>
      scoped.some((result) => result.chunk.text.toLowerCase().includes(term.toLowerCase()))
    );
    const forbiddenAbsent = !item.forbiddenSource || !scoped.some((result) => result.chunk.sourceUrl.includes(item.forbiddenSource));
    const pass = item.category === "ambiguous"
      ? clarificationRequired
      : item.category === "unanswerable"
      ? intent === "status"
      : item.category === "irrelevant"
      ? classification.domain !== "government_schemes" && forbiddenAbsent
      : sourceHit && termsHit && forbiddenAbsent;

    return {
      id: item.id,
      category: item.category,
      pass,
      classifiedDomain: classification.domain,
      clarificationRequired,
      pmKisanIntent: intent,
      sourceHit,
      termsHit,
      forbiddenAbsent,
      baselineTop3: baseline.map(({ chunk, score }) => ({ title: chunk.sourceTitle, url: chunk.sourceUrl, score })),
      scopedTop3: scoped.map(({ chunk, score, semanticScore, bm25Score }) => ({
        title: chunk.sourceTitle,
        url: chunk.sourceUrl,
        score,
        cosineSimilarity: semanticScore,
        keywordScore: bm25Score,
        chunkIndex: chunk.chunkIndex,
        preview: chunk.text.slice(0, 180).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]").replace(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/g, "[PHONE]").replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[AADHAAR]"),
      })),
      keywordTop3: keyword.map(({ chunk, score }) => ({ title: chunk.sourceTitle, url: chunk.sourceUrl, score })),
    };
  });

  const report = {
    store: {
      chunks: chunks.length,
      embeddingDimensions: Object.fromEntries(dimCounts),
      embeddingModels: Object.fromEntries(modelCounts),
      revisedFaqChunks: chunks.filter((chunk) => chunk.sourceUrl.endsWith("/RevisedFAQ.pdf")).length,
      oversizedChunks: chunks.filter((chunk) => chunk.text.length > 900).length,
    },
    summary: {
      cases: rows.length,
      passedChecks: rows.filter((row) => row.pass).length,
      failedChecks: rows.filter((row) => !row.pass).length,
    },
    chunkingChecks: (() => {
      const longText = "Policy details " + "x".repeat(4000);
      const chunks = chunker.chunkText(longText, {
        maxChunkSize: 800,
        overlapSize: 100,
        minChunkSize: 80,
        sourceUrl: "https://example.gov/document.pdf",
        sourceDomain: "government_schemes",
        sourceTitle: "Chunk regression",
      });
      return {
        maxLength: Math.max(0, ...chunks.map((chunk) => chunk.text.length)),
        allWithinLimit: chunks.length > 1 && chunks.every((chunk) => chunk.text.length <= 800),
        sourceMetadataPreserved: chunks.every((chunk) => chunk.sourceUrl === "https://example.gov/document.pdf"),
      };
    })(),
    results: rows,
  };

  console.log(JSON.stringify({
    store: report.store,
    summary: report.summary,
    chunkingChecks: report.chunkingChecks,
    results: rows.map(({ id, category, pass, classifiedDomain, sourceHit, termsHit, forbiddenAbsent, baselineTop3, scopedTop3 }) => ({
      id,
      category,
      pass,
      classifiedDomain,
      sourceHit,
      termsHit,
      forbiddenAbsent,
      baselineTop3: baselineTop3.map(({ title, score }) => ({ title, score })),
      scopedTop3: scopedTop3.map(({ title, score }) => ({ title, score })),
    })),
  }, null, 2));
  if (report.summary.failedChecks > 0 || !report.chunkingChecks.allWithinLimit || !report.chunkingChecks.sourceMetadataPreserved) process.exitCode = 1;
} finally {
  await vite.close();
}
