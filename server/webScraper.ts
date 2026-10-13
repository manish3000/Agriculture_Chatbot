/**
 * Web Scraper — Government Agriculture Portals
 *
 * Scrapes verified agriculture content from official Indian government websites.
 * Uses cheerio for HTML parsing and native fetch with standard browser headers.
 *
 * Target sites:
 * - pmkisan.gov.in (PM-KISAN Samman Nidhi Portal)
 * - agriportal.cg.nic.in (Chhattisgarh State Agriculture Portal)
 * - nfsm.gov.in (National Food Security & Nutrition Mission)
 * - icar.org.in (Indian Council of Agricultural Research)
 * - soilhealth.dac.gov.in (Soil Health Card Scheme Portal)
 * - pmfby.gov.in (PM Fasal Bima Yojana)
 */

import * as cheerio from "cheerio";

// ─── Ensure TLS ignores for Indian Government CA certs ────────────────────────
if (typeof process !== "undefined" && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedPage {
  url: string;
  title: string;
  domain: string;
  text: string;               // Cleaned extracted text
  discoveredPdfUrls?: string[]; // PDF links found on page
  scrapedAt: string;          // ISO timestamp
  success: boolean;
  error?: string;
}

export interface ScrapeTarget {
  url: string;
  domain: string;           // matches AgriDomain
  selectors: string[];      // CSS selectors to extract content from
  excludeSelectors?: string[]; // Selectors to strip (nav, footer, ads)
  description: string;
}

// ─── Scrape Targets ───────────────────────────────────────────────────────────

export const SCRAPE_TARGETS: ScrapeTarget[] = [
  // ── PM-KISAN ────────────────────────────────────────────────────────────────
  {
    url: "https://pmkisan.gov.in/",
    domain: "government_schemes",
    description: "PM-KISAN Samman Nidhi Portal",
    selectors: ["main", ".content", "#content", "article", ".scheme-content", "p", "h1", "h2", "h3", "li"],
    excludeSelectors: ["nav", "header", "footer", ".menu", ".navbar", "script", "style"],
  },

  // ── CG Agriculture Portal ───────────────────────────────────────────────────
  {
    url: "https://agriportal.cg.nic.in/PortEn/Default.aspx",
    domain: "government_schemes",
    description: "Chhattisgarh State Agriculture Department Portal",
    selectors: ["#ContentPlaceHolder1_Label1", ".content", "p", "h1", "h2", "h3", "li", "td"],
    excludeSelectors: ["nav", "header", "footer", "script", "style", ".menu"],
  },

  // ── NFSM (National Food Security & Nutrition Mission) ───────────────────────
  {
    url: "https://nfsm.gov.in/",
    domain: "government_schemes",
    description: "National Food Security & Nutrition Mission Portal",
    selectors: ["main", ".content", "article", "p", "h1", "h2", "h3", "li"],
    excludeSelectors: ["nav", "header", "footer", "script", "style"],
  },

  // ── ICAR (Indian Council of Agricultural Research) ──────────────────────────
  {
    url: "https://icar.org.in/",
    domain: "crop_practices",
    description: "ICAR National Agricultural Research Portal",
    selectors: ["main", ".view-content", ".field-content", "article", "p", "h2", "h3", "li"],
    excludeSelectors: ["nav", "header", "footer", "script", "style", ".menu"],
  },

  // ── Soil Health Card Portal ─────────────────────────────────────────────────
  {
    url: "https://soilhealth.dac.gov.in/",
    domain: "soil_and_fertilizer",
    description: "Soil Health Card Scheme Portal",
    selectors: ["main", ".content", "article", "p", "h1", "h2", "h3", "li"],
    excludeSelectors: ["nav", "header", "footer", "script", "style"],
  },

  // ── PMFBY Crop Insurance ────────────────────────────────────────────────────
  {
    url: "https://pmfby.gov.in/",
    domain: "crop_insurance",
    description: "PMFBY Crop Insurance Scheme Portal",
    selectors: ["main", ".content", "article", "p", "h1", "h2", "h3", "li"],
    excludeSelectors: ["nav", "header", "footer", "script", "style"],
  },

  // ── CG Horticulture Portal (English & Hindi) ────────────────────────────────
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx",
    domain: "horticulture",
    description: "Chhattisgarh State Horticulture & Farm Forestry Directorate",
    selectors: ["main", ".content", "#content", "p", "h1", "h2", "h3", "h4", "li", "table"],
    excludeSelectors: ["nav", "header", "footer", "script", "style", ".menu"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiEn/aboutus.htm",
    domain: "horticulture",
    description: "About Chhattisgarh Horticulture, Fruits, Vegetables & Spices",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiEn/CentralScheme.html",
    domain: "horticulture",
    description: "Central Schemes for Horticulture in Chhattisgarh (MIDH, RKVY, PMKSY)",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiEn/StateScheme.html",
    domain: "horticulture",
    description: "Chhattisgarh State Schemes for Horticulture (Samakit, Spice, Potato)",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiHi/aboutus.htm",
    domain: "horticulture",
    description: "छत्तीसगढ़ उद्यानिकी परिचय एवं फल/सब्जी/मसाला उत्पादन स्थिति",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiHi/StateScheme.html",
    domain: "horticulture",
    description: "छत्तीसगढ़ राज्य पोषित उद्यानिकी योजनाएं (समेकित उद्यानिकी, मसाला, आलू)",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
  {
    url: "https://agriportal.cg.nic.in/horticulture/HortiHi/CentralScheme.html",
    domain: "horticulture",
    description: "छत्तीसगढ़ केंद्र पोषित उद्यानिकी योजनाएं (एकीकृत बागवानी, आरकेवीवाई)",
    selectors: ["body", "p", "h1", "h2", "h3", "li", "table"],
    excludeSelectors: ["script", "style"],
  },
];

// ─── HTTP Fetcher ─────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 25_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return await res.text();
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") throw new Error(`Timeout fetching ${url}`);
    throw err;
  }
}

// ─── Text Cleaner ─────────────────────────────────────────────────────────────

function cleanText(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 20) // remove short nav/menu lines
    .filter((line) => !/<[^>]+>/.test(line)) // remove any leftover HTML
    .filter((line) => !/^[\s\-–|•·]+$/.test(line)) // remove separator lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse excess blank lines
    .replace(/[ \t]{2,}/g, " ")  // collapse inline spaces
    .trim();
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────

/**
 * Scrapes a single target page and extracts clean text content.
 */
export async function scrapePage(target: ScrapeTarget): Promise<ScrapedPage> {
  const scrapedAt = new Date().toISOString();

  try {
    console.log(`[Scraper] Fetching: ${target.url}`);
    const html = await fetchPage(target.url);
    const $ = cheerio.load(html);

    // Discover PDF links on the page
    const discoveredPdfUrls: string[] = [];
    $("a").each((_i, el) => {
      const href = $(el).attr("href");
      if (href && href.toLowerCase().includes(".pdf")) {
        try {
          const resolved = new URL(href, target.url).href;
          if (!discoveredPdfUrls.includes(resolved)) {
            discoveredPdfUrls.push(resolved);
          }
        } catch {}
      }
    });

    // Remove excluded selectors
    if (target.excludeSelectors) {
      for (const sel of target.excludeSelectors) {
        $(sel).remove();
      }
    }

    // Also strip scripts, styles, hidden elements
    $("script, style, noscript, iframe, [hidden], [aria-hidden='true']").remove();

    // Extract page title
    const title =
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      target.description;

    // Extract text from selectors
    const textParts: string[] = [];
    for (const selector of target.selectors) {
      $(selector).each((_i, el) => {
        const text = $(el).text().trim();
        if (text.length > 35) {
          textParts.push(text);
        }
      });
    }

    // Deduplicate and clean
    const seen = new Set<string>();
    const uniqueParts = textParts.filter((p) => {
      const key = p.slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const rawText = uniqueParts.join("\n");
    const cleanedText = cleanText(rawText);

    if (cleanedText.length < 80) {
      throw new Error("Extracted text too short — page may be JavaScript-rendered or blocked");
    }

    console.log(
      `[Scraper] ✓ ${target.description}: ${cleanedText.length} chars, ${discoveredPdfUrls.length} PDFs found`
    );

    return {
      url: target.url,
      title,
      domain: target.domain,
      text: cleanedText,
      discoveredPdfUrls: discoveredPdfUrls.slice(0, 10),
      scrapedAt,
      success: true,
    };
  } catch (err: any) {
    console.warn(`[Scraper] ✗ Failed: ${target.url} — ${err.message}`);
    return {
      url: target.url,
      title: target.description,
      domain: target.domain,
      text: "",
      scrapedAt,
      success: false,
      error: err.message,
    };
  }
}

/**
 * Scrapes all target pages concurrently (with concurrency limit).
 */
export async function scrapeAllTargets(
  targets: ScrapeTarget[] = SCRAPE_TARGETS
): Promise<ScrapedPage[]> {
  const CONCURRENCY = 2;
  const results: ScrapedPage[] = [];

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(scrapePage));
    results.push(...batchResults);

    if (i + CONCURRENCY < targets.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `[Scraper] Complete: ${successCount}/${results.length} pages scraped successfully`
  );

  return results;
}
