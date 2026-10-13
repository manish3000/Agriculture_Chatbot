import fs from "node:fs";
import { createServer } from "vite";
import * as cheerio from "cheerio";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  console.log("=== INGESTING CHHATTISGARH HORTICULTURE CONTENT ===");
  const vite = await createServer({
    configFile: "vite.config.ts",
    logLevel: "error",
    server: { middlewareMode: true },
  });

  try {
    const store = await vite.ssrLoadModule("/server/vectorStore.ts");
    const chunker = await vite.ssrLoadModule("/server/textChunker.ts");
    const vectorizer = await vite.ssrLoadModule("/server/vectorizer.ts");

    store.loadVectorStore(true);
    const initialCount = store.getChunkCount();
    console.log(`Initial Vector Store Chunks: ${initialCount}`);

    const targets = [
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
        title: "Chhattisgarh Directorate of Horticulture and Farm Forestry",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiEn/aboutus.htm",
        title: "Status and Crop Distribution of Horticulture in Chhattisgarh",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiEn/CentralScheme.html",
        title: "Central Sponsored Schemes for Horticulture (MIDH, RKVY, PMKSY)",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiEn/StateScheme.html",
        title: "Chhattisgarh State Schemes for Horticulture (Samakit, Spice, Potato)",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiHi/aboutus.htm",
        title: "छत्तीसगढ़ उद्यानिकी परिचय एवं फल/सब्जी/मसाला उत्पादन",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiHi/StateScheme.html",
        title: "छत्तीसगढ़ राज्य पोषित उद्यानिकी योजनाएं (समेकित उद्यानिकी, मसाला क्षेत्र विस्तार, आलू प्रदर्शन)",
        domain: "horticulture",
      },
      {
        url: "https://agriportal.cg.nic.in/horticulture/HortiHi/CentralScheme.html",
        title: "छत्तीसगढ़ केंद्र पोषित उद्यानिकी योजनाएं (एकीकृत बागवानी विकास मिशन, आरकेवीवाई)",
        domain: "horticulture",
      },
    ];

    const documentsToChunk = [];

    for (const target of targets) {
      console.log(`Fetching: ${target.url} ...`);
      try {
        const res = await fetch(target.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        $("script, style, noscript, nav, header, footer").remove();
        const cleanText = $("body").text().replace(/\s+/g, " ").trim();

        if (cleanText.length > 50) {
          documentsToChunk.push({
            text: cleanText,
            sourceUrl: target.url,
            sourceDomain: target.domain,
            sourceTitle: target.title,
          });
          console.log(` -> Extracted ${cleanText.length} characters.`);
        }
      } catch (err) {
        console.warn(`Failed to fetch ${target.url}:`, err.message);
      }
    }

    console.log(`\nChunking ${documentsToChunk.length} horticulture documents...`);
    const chunks = chunker.chunkDocuments(documentsToChunk, {
      maxChunkSize: 800,
      overlapSize: 100,
      minChunkSize: 80,
    });
    console.log(`Generated ${chunks.length} text chunks.`);

    console.log("Embedding and storing chunks...");
    const storedChunks = chunks.map((c, i) => {
      const textToEmbed = `${c.contextHeader} ${c.text}`;
      const embedding = vectorizer.generateLocalEmbedding(textToEmbed);
      return {
        id: c.id,
        text: c.text,
        contextHeader: c.contextHeader,
        domain: c.sourceDomain,
        sourceUrl: c.sourceUrl,
        sourceTitle: c.sourceTitle,
        embedding,
        embeddingModel: vectorizer.EMBEDDING_MODEL_ID,
        addedAt: new Date().toISOString(),
        charCount: c.charCount,
        chunkIndex: c.index,
        totalChunks: c.totalChunks,
      };
    });

    const added = store.addChunks(storedChunks);
    store.forceSaveVectorStore();
    const finalCount = store.getChunkCount();

    console.log(`\nSUCCESS! Added ${added} new horticulture chunks.`);
    console.log(`Vector store now contains: ${finalCount} total chunks.`);
  } finally {
    await vite.close();
  }
}

main().catch(console.error);
