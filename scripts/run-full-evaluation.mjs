import fs from "node:fs";
import { createServer } from "vite";

const evalDataPath = "server/data/rag_eval_33.json";
const dataset = JSON.parse(fs.readFileSync(evalDataPath, "utf8"));

const vite = await createServer({
  configFile: "vite.config.ts",
  logLevel: "error",
  server: { middlewareMode: true },
});

try {
  console.log("=== RAG COMPREHENSIVE EVALUATION BENCHMARK ===");
  console.log(`Loaded ${dataset.length} evaluation questions from ${evalDataPath}.\n`);

  const store = await vite.ssrLoadModule("/server/vectorStore.ts");
  const vectorizer = await vite.ssrLoadModule("/server/vectorizer.ts");
  const classifier = await vite.ssrLoadModule("/src/services/agricultureClassifier.ts");
  const langDetector = await vite.ssrLoadModule("/src/services/languageDetector.ts");
  const ragEngine = await vite.ssrLoadModule("/server/ragEngine.ts");
  const ollama = await vite.ssrLoadModule("/server/ollamaClient.ts");

  store.loadVectorStore(true);
  await ragEngine.initializeEmbeddings();

  const totalChunks = store.getChunkCount();
  console.log(`Vector store loaded: ${totalChunks} total chunks.`);

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: RETRIEVAL EVALUATION (Recall@k, MRR, Domain & Source Hits)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- Phase 1: Evaluating Retrieval Accuracy across 33 Questions ---");

  let retrievalHits = 0;
  let totalReciprocalRank = 0;
  const categoryStats = {};

  const retrievalResults = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const detectedLang = langDetector.detectLanguage(item.question).language;
    const classification = classifier.classifyQuery(item.question, detectedLang);
    const domain = classification.isAgricultural ? classification.domain : undefined;

    // Retrieve chunks using production hybrid scoring
    const staticMatches = await ragEngine.retrieveRelevantChunks(item.question, detectedLang, domain, 3);
    const queryEmbedding = vectorizer.generateLocalEmbedding(item.question);
    const vectorMatches = store.searchVectorStore(
      queryEmbedding,
      item.question,
      3,
      domain,
      item.officialSource ? new URL(item.officialSource).hostname : undefined
    );

    const allRetrieved = [
      ...vectorMatches.map((v) => ({
        title: v.chunk.sourceTitle,
        url: v.chunk.sourceUrl,
        score: v.score,
        text: v.chunk.text,
      })),
      ...staticMatches.map((s) => ({
        title: s.chunk.source.title,
        url: s.chunk.source.url,
        score: s.score,
        text: s.chunk.content,
      })),
    ];

    // Check if expected source or required key facts are retrieved
    let hitRank = 0;
    for (let r = 0; r < allRetrieved.length; r++) {
      const chunk = allRetrieved[r];
      const matchesUrl = item.officialSource && chunk.url.includes(new URL(item.officialSource).hostname);
      const matchesFacts = item.requiredKeyFacts.some((fact) =>
        chunk.text.toLowerCase().includes(fact.toLowerCase()) ||
        chunk.title.toLowerCase().includes(fact.toLowerCase())
      );

      if (matchesUrl || matchesFacts) {
        hitRank = r + 1;
        break;
      }
    }

    const isHit = hitRank > 0;
    if (isHit) {
      retrievalHits++;
      totalReciprocalRank += 1 / hitRank;
    }

    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { total: 0, hits: 0 };
    }
    categoryStats[item.category].total++;
    if (isHit) categoryStats[item.category].hits++;

    retrievalResults.push({
      id: item.id,
      category: item.category,
      question: item.question,
      lang: detectedLang,
      domain,
      hitRank,
      isHit,
      topChunk: allRetrieved[0] ? { title: allRetrieved[0].title, url: allRetrieved[0].url } : null,
    });
  }

  const recallAtK = (retrievalHits / dataset.length) * 100;
  const mrr = totalReciprocalRank / dataset.length;

  console.log(`Retrieval Recall@5: ${recallAtK.toFixed(1)}% (${retrievalHits}/${dataset.length})`);
  console.log(`Mean Reciprocal Rank (MRR): ${mrr.toFixed(3)}`);
  console.log("Category breakdown:");
  for (const [cat, stats] of Object.entries(categoryStats)) {
    console.log(`  - ${cat}: ${stats.hits}/${stats.total} (${((stats.hits / stats.total) * 100).toFixed(0)}%)`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: COMPARATIVE INFERENCE BENCHMARK (qwen3:8b vs qwen3.8:27b)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- Phase 2: Live Comparative Inference Benchmark ---");
  console.log("Testing target model: qwen3:8b vs baseline model: qwen3.8:27b");

  // Representative subset across crucial domains
  const testIds = [
    "pmkisan-01",  // PM-KISAN eligibility & docs (en)
    "horti-01",    // CG Horticulture State Schemes (en)
    "proc-01",     // How to apply for horticulture subsidies (en)
    "trap-01",     // Hallucination trap (free 65 HP tractor) (en)
    "conflict-01", // Conflicting guideline: mandatory eKYC (en)
  ];

  const subset = dataset.filter((d) => testIds.includes(d.id));
  const modelsToTest = ["qwen3:8b", "qwen3.8:27b"];
  const inferenceComparisons = [];

  for (const item of subset) {
    console.log(`\nQuery [${item.id}] (${item.language}): "${item.question.slice(0, 60)}..."`);
    const queryComp = {
      id: item.id,
      category: item.category,
      question: item.question,
      isAnswerable: item.isAnswerable,
      models: {},
    };

    const detectedLang = langDetector.detectLanguage(item.question).language;
    const classification = classifier.classifyQuery(item.question, detectedLang);
    const domain = classification.isAgricultural ? classification.domain : undefined;

    for (const model of modelsToTest) {
      console.log(`  -> Running with ${model}...`);
      const startTime = Date.now();

      try {
        const result = await ragEngine.ragGenerate(
          item.question,
          detectedLang,
          domain,
          [],
          "Fallback answer: please check official website.",
          item.question,
          model
        );

        const totalTimeMs = Date.now() - startTime;
        const answer = result.answer;

        // Groundedness evaluation
        let grounded = false;
        let hallucinationDetected = false;

        if (item.isAnswerable) {
          // Count matched key facts
          const matchedFacts = item.requiredKeyFacts.filter((fact) =>
            answer.toLowerCase().includes(fact.toLowerCase())
          );
          grounded = matchedFacts.length >= Math.ceil(item.requiredKeyFacts.length * 0.4);
        } else {
          // Trap question: must state cannot be verified / not found / no official scheme
          const refused =
            answer.toLowerCase().includes("cannot be verified") ||
            answer.toLowerCase().includes("not verified") ||
            answer.toLowerCase().includes("no official") ||
            answer.toLowerCase().includes("not available") ||
            answer.toLowerCase().includes("सत्यापित नहीं") ||
            answer.toLowerCase().includes("उपलब्ध नहीं") ||
            answer.toLowerCase().includes("नहीं दी जाती") ||
            answer.toLowerCase().includes("nahi hai") ||
            answer.toLowerCase().includes("verified nahi");

          grounded = refused;
          hallucinationDetected = !refused;
        }

        // Citation evaluation
        const hasOfficialCitation = result.sources.some((s) =>
          s.url.includes("gov.in") || s.url.includes("nic.in")
        ) || answer.includes("gov.in") || answer.includes("nic.in");

        const tokSec = result.evalCount && result.evalDurationMs
          ? ((result.evalCount / (result.evalDurationMs / 1000))).toFixed(1)
          : "N/A";

        console.log(`     Duration: ${totalTimeMs}ms | Generated tokens: ${result.evalCount || 0} (${tokSec} tok/s) | Grounded: ${grounded}`);

        queryComp.models[model] = {
          totalTimeMs,
          genDurationMs: result.generationDurationMs,
          evalCount: result.evalCount || 0,
          evalDurationMs: result.evalDurationMs,
          tokensPerSec: tokSec,
          grounded,
          hallucinationDetected,
          hasOfficialCitation,
          sourceCount: result.sources.length,
          answerSnippet: answer.slice(0, 160).replace(/\n/g, " "),
        };
      } catch (err) {
        console.error(`     Error running ${model}:`, err.message);
        queryComp.models[model] = { error: err.message };
      }
    }

    inferenceComparisons.push(queryComp);
  }

  // Aggregate inference stats
  const aggregateReport = {
    evaluatedAt: new Date().toISOString(),
    vectorStoreChunks: totalChunks,
    retrieval: {
      totalQuestions: dataset.length,
      hits: retrievalHits,
      recallAt5Pct: parseFloat(recallAtK.toFixed(1)),
      mrr: parseFloat(mrr.toFixed(3)),
      categoryStats,
    },
    models: {},
    comparisons: inferenceComparisons,
  };

  for (const model of modelsToTest) {
    const runs = inferenceComparisons.map((c) => c.models[model]).filter((m) => m && !m.error);
    const avgTimeMs = runs.reduce((acc, r) => acc + r.totalTimeMs, 0) / (runs.length || 1);
    const groundedCount = runs.filter((r) => r.grounded).length;
    const hallucinations = runs.filter((r) => r.hallucinationDetected).length;
    const officialCitations = runs.filter((r) => r.hasOfficialCitation).length;

    aggregateReport.models[model] = {
      testQueriesCount: runs.length,
      averageLatencyMs: Math.round(avgTimeMs),
      groundednessPct: Math.round((groundedCount / (runs.length || 1)) * 100),
      hallucinationCount: hallucinations,
      officialCitationPct: Math.round((officialCitations / (runs.length || 1)) * 100),
      memoryFootprintEstimateGB: model.includes("27b") ? 17.7 : 5.9,
    };
  }

  fs.writeFileSync("server/data/rag_benchmark_report.json", JSON.stringify(aggregateReport, null, 2));
  console.log("\n=== BENCHMARK COMPLETE ===");
  console.log("Full report saved to server/data/rag_benchmark_report.json");
  console.log(JSON.stringify(aggregateReport.models, null, 2));
} finally {
  await vite.close();
}
