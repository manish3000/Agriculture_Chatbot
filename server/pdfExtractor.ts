/**
 * PDF Text Extractor
 *
 * Extracts text from English and Hindi agriculture PDF documents from official
 * government portals using pdf-parse v2.
 * Supports both local files and remote PDF URLs.
 */

import fs from "node:fs";
import path from "node:path";
// @ts-ignore — pdf-parse v2 export
import { PDFParse } from "pdf-parse";

// ─── Ensure TLS ignores for Indian Government CA certs ────────────────────────
// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedPDF {
  filePath: string;
  sourceUrl?: string;
  fileName: string;
  title: string;
  text: string;
  pages: number;
  extractedAt: string;
  success: boolean;
  error?: string;
  domain?: string;
}

export interface GovPdfTarget {
  url: string;
  fileName: string;
  title: string;
  domain: string;
}

// ─── Verified Government Scheme PDF Targets ───────────────────────────────────

export const GOVERNMENT_PDF_TARGETS: GovPdfTarget[] = [
  {
    url: "https://pmkisan.gov.in/Documents/FAQPMKISAN.PDF",
    fileName: "PM_KISAN_Official_FAQs.pdf",
    title: "PM-KISAN Official Frequently Asked Questions & Guidelines",
    domain: "government_schemes",
  },
  {
    url: "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf",
    fileName: "PM_KISAN_Operational_Guidelines.pdf",
    title: "PM-KISAN Revised Operational Guidelines (DAC&FW)",
    domain: "government_schemes",
  },
  {
    url: "https://pmkisan.gov.in/Documents/PMKisanSamanNidhi.PDF",
    fileName: "PM_KISAN_Scheme_Details.pdf",
    title: "Pradhan Mantri Kisan Samman Nidhi Scheme Norms & Objectives",
    domain: "government_schemes",
  },
  {
    url: "https://nfsm.gov.in/Guidelines/NFSNM%20GUIDELINES%20APPROVED%20FY%202025-2026.pdf",
    fileName: "NFSNM_Guidelines_FY_2025_2026.pdf",
    title: "National Food Security & Nutrition Mission (NFSNM) Guidelines FY 2025-26",
    domain: "government_schemes",
  },
  {
    url: "https://agriportal.cg.nic.in/PDF/Vision/Vision.PDF",
    fileName: "CG_Agriculture_Vision.pdf",
    title: "Chhattisgarh Agriculture Vision & Mandi Board Policy",
    domain: "government_schemes",
  },
];

// ─── PDF Directory ────────────────────────────────────────────────────────────

const PDF_UPLOAD_DIR = path.resolve("server", "data", "pdfs");

/** Ensure the PDF upload directory exists */
export function ensurePdfDir(): void {
  if (!fs.existsSync(PDF_UPLOAD_DIR)) {
    fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });
    console.log(`[PDF] Created PDF directory: ${PDF_UPLOAD_DIR}`);
  }
}

// ─── Text Cleaner ─────────────────────────────────────────────────────────────

function cleanPdfText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\f/g, "\n\n")          // Form feeds → paragraph breaks
    .replace(/[ \t]{2,}/g, " ")       // Collapse inline whitespace
    .replace(/\n{3,}/g, "\n\n")       // Collapse excessive blank lines
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      // Remove very short lines that are likely headers/footers/page numbers
      if (line.length < 4) return false;
      // Remove lines that are just numbers (page numbers)
      if (/^\d{1,4}$/.test(line)) return false;
      // Remove common PDF artifact lines
      if (/^(page|pg|p\.)\s*\d/i.test(line)) return false;
      if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

// ─── Core Parser Helper ───────────────────────────────────────────────────────

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result?.text || "";
    const pages = result?.total || 1;
    return { text, pages };
  } finally {
    try {
      await parser.destroy();
    } catch {}
  }
}

// ─── Extract from Local File ──────────────────────────────────────────────────

/**
 * Extracts text from a local PDF file.
 */
export async function extractPdfFromFile(
  filePath: string,
  domain: string = "government_schemes"
): Promise<ExtractedPDF> {
  const extractedAt = new Date().toISOString();
  const fileName = path.basename(filePath);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const { text, pages } = await parsePdfBuffer(buffer);
    const cleanedText = cleanPdfText(text);

    if (cleanedText.length < 50) {
      throw new Error(
        "Extracted text too short — PDF may be scanned/image-only"
      );
    }

    console.log(
      `[PDF] ✓ ${fileName}: ${pages} pages, ${cleanedText.length} chars extracted`
    );

    return {
      filePath,
      fileName,
      title: fileName.replace(/\.pdf$/i, "").replace(/_/g, " "),
      text: cleanedText,
      pages,
      extractedAt,
      success: true,
      domain,
    };
  } catch (err: any) {
    console.warn(`[PDF] ✗ Failed: ${fileName} — ${err.message}`);
    return {
      filePath,
      fileName,
      title: fileName,
      text: "",
      pages: 0,
      extractedAt,
      success: false,
      error: err.message,
      domain,
    };
  }
}

// ─── Extract from URL ─────────────────────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Downloads and extracts text from a remote PDF URL.
 */
export async function extractPdfFromUrl(
  url: string,
  fileName?: string,
  title?: string,
  domain: string = "government_schemes"
): Promise<ExtractedPDF> {
  const extractedAt = new Date().toISOString();
  const safeName =
    fileName || url.split("/").pop()?.split("?")[0] || "document.pdf";
  const displayTitle = title || safeName.replace(/\.pdf$/i, "").replace(/_/g, " ");

  try {
    console.log(`[PDF] Downloading: ${url}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/pdf,application/octet-stream,*/*",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk in pdf directory
    ensurePdfDir();
    const savePath = path.join(PDF_UPLOAD_DIR, safeName);
    fs.writeFileSync(savePath, buffer);

    const { text, pages } = await parsePdfBuffer(buffer);
    const cleanedText = cleanPdfText(text);

    if (cleanedText.length < 50) {
      throw new Error("Extracted text too short — PDF may be image-only");
    }

    console.log(
      `[PDF] ✓ ${safeName}: ${pages} pages, ${cleanedText.length} chars extracted`
    );

    return {
      filePath: savePath,
      sourceUrl: url,
      fileName: safeName,
      title: displayTitle,
      text: cleanedText,
      pages,
      extractedAt,
      success: true,
      domain,
    };
  } catch (err: any) {
    console.warn(`[PDF] ✗ URL failed: ${url} — ${err.message}`);
    return {
      filePath: url,
      fileName: safeName,
      title: displayTitle,
      text: "",
      pages: 0,
      extractedAt,
      success: false,
      error: err.message,
      domain,
    };
  }
}

// ─── Download and Extract Official Government PDFs ────────────────────────────

/**
 * Downloads and extracts all target government PDFs.
 */
export async function downloadAndExtractGovPdfs(): Promise<ExtractedPDF[]> {
  ensurePdfDir();
  const results: ExtractedPDF[] = [];

  console.log(`[PDF] Processing ${GOVERNMENT_PDF_TARGETS.length} government PDF targets...`);

  for (const target of GOVERNMENT_PDF_TARGETS) {
    const localPath = path.join(PDF_UPLOAD_DIR, target.fileName);

    // If already downloaded locally and valid, extract from local file to save bandwidth
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      console.log(`[PDF] Found existing cached PDF: ${target.fileName}`);
      const res = await extractPdfFromFile(localPath, target.domain);
      if (res.success) {
        res.title = target.title;
        res.sourceUrl = target.url;
        results.push(res);
        continue;
      }
    }

    // Otherwise download fresh from government URL
    const res = await extractPdfFromUrl(
      target.url,
      target.fileName,
      target.title,
      target.domain
    );
    results.push(res);
  }

  return results;
}

// ─── Extract All PDFs in Directory ────────────────────────────────────────────

/**
 * Extracts text from all PDF files in the upload directory.
 */
export async function extractAllPdfsInDir(
  dirPath: string = PDF_UPLOAD_DIR
): Promise<ExtractedPDF[]> {
  ensurePdfDir();

  if (!fs.existsSync(dirPath)) {
    console.log(`[PDF] Directory not found: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath).filter((f) =>
    f.toLowerCase().endsWith(".pdf")
  );

  if (files.length === 0) {
    console.log(`[PDF] No PDF files found in ${dirPath}`);
    return [];
  }

  console.log(`[PDF] Found ${files.length} PDF files to process in ${dirPath}`);
  const results: ExtractedPDF[] = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const result = await extractPdfFromFile(fullPath);
    const officialTarget = GOVERNMENT_PDF_TARGETS.find(
      (target) => target.fileName.toLowerCase() === file.toLowerCase()
    );
    if (officialTarget && result.success) {
      result.sourceUrl = officialTarget.url;
      result.title = officialTarget.title;
      result.domain = officialTarget.domain;
    }
    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `[PDF] Complete: ${successCount}/${results.length} PDFs extracted`
  );

  return results;
}

/**
 * Returns the path to the PDF upload directory
 */
export function getPdfUploadDir(): string {
  ensurePdfDir();
  return PDF_UPLOAD_DIR;
}
