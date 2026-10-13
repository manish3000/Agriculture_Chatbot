import * as cheerio from "cheerio";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function inspectHindi() {
  const pages = [
    "https://agriportal.cg.nic.in/horticulture/HortiHi/aboutus.htm",
    "https://agriportal.cg.nic.in/horticulture/HortiHi/StateScheme.html",
    "https://agriportal.cg.nic.in/horticulture/HortiHi/CentralScheme.html",
  ];

  for (const url of pages) {
    console.log("\n=======================================================");
    console.log("FETCHING:", url);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();
    console.log("PAGE TITLE:", $('title').text().trim());
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    console.log("TEXT SAMPLE (1500 chars):\n", text.slice(0, 1500));
  }
}

inspectHindi().catch(console.error);
