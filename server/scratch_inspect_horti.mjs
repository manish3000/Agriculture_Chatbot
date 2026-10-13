import * as cheerio from "cheerio";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function inspectHorti() {
  const url = "https://agriportal.cg.nic.in/horticulture/HortiEn/Default.aspx";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("TITLE:", $("title").text().trim());
  
  // Find all nav/menu links
  const links = [];
  $("a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href");
    if (text && href && !href.startsWith("#") && !href.startsWith("javascript")) {
      const full = href.startsWith("http") ? href : new URL(href, url).toString();
      links.push({ text, href: full });
    }
  });
  
  console.log("FOUND LINKS COUNT:", links.length);
  for (const l of links.slice(0, 30)) {
    console.log(` - ${l.text} -> ${l.href}`);
  }

  // Also check iframes
  $("iframe").each((_, el) => {
    console.log("IFRAME SRC:", $(el).attr("src"));
  });

  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  console.log("\nMAIN PAGE TEXT (first 1000 chars):\n", bodyText.slice(0, 1000));
}

inspectHorti().catch(console.error);
