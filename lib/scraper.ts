import chromiumBinary from "@sparticuz/chromium";
import { chromium, Browser } from "playwright-core";
import tinycolor from "tinycolor2";
import type { BrandColor, BrandFont, BrandLogo, BrandData } from "@/types/brand";

// Using require() because color-namer doesn't have a proper ESM export
// eslint-disable-next-line
const colorNamer = require("color-namer");

// System fonts that are not web fonts
const SYSTEM_FONTS = new Set([
  "arial",
  "helvetica",
  "times new roman",
  "times",
  "georgia",
  "verdana",
  "trebuchet ms",
  "courier new",
  "courier",
  "impact",
  "comic sans ms",
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "segoe ui",
  "roboto",
  "oxygen",
  "ubuntu",
  "cantarell",
  "fira sans",
  "droid sans",
  "helvetica neue",
]);

// Browser singleton — reused across requests to avoid per-request launch overhead
let browser: Browser | null = null;

const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    if (IS_SERVERLESS) {
      // On Vercel: use @sparticuz/chromium binary + args optimized for serverless
      browser = await chromium.launch({
        args: chromiumBinary.args,
        executablePath: await chromiumBinary.executablePath(),
        headless: true,
      });
    } else {
      // Local dev: use the playwright-installed Chromium binary
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    }
  }
  return browser;
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function rgbDistance(a: tinycolor.Instance, b: tinycolor.Instance): number {
  const { r: r1, g: g1, b: b1 } = a.toRgb();
  const { r: r2, g: g2, b: b2 } = b.toRgb();
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function getColorName(hex: string): string {
  try {
    const names = colorNamer(hex, { pick: ["ntc"] });
    return names?.ntc?.[0]?.name || hex;
  } catch {
    return hex;
  }
}

interface RawColor {
  value: string;
  source: string;
}

function processColors(raw: RawColor[]): BrandColor[] {
  const parsed = raw
    .map((r) => ({ tc: tinycolor(r.value), source: r.source }))
    .filter((r) => r.tc.isValid());

  // Filter out transparent, near-white, near-black
  const meaningful = parsed.filter(({ tc }) => {
    const { a } = tc.toRgb();
    if (a < 0.1) return false;
    const lum = tc.getLuminance();
    if (lum > 0.92) return false; // near-white
    if (lum < 0.008) return false; // near-black
    return true;
  });

  // Greedy clustering: merge colors within RGB distance 40
  const THRESHOLD = 40;
  const clusters: Array<{ tc: tinycolor.Instance; source: string; count: number }> = [];

  for (const { tc, source } of meaningful) {
    const match = clusters.find((c) => rgbDistance(c.tc, tc) < THRESHOLD);
    if (match) {
      match.count++;
    } else {
      clusters.push({ tc, source, count: 1 });
    }
  }

  clusters.sort((a, b) => b.count - a.count);

  return clusters.slice(0, 12).map(({ tc, source }) => ({
    hex: tc.toHexString(),
    name: getColorName(tc.toHexString()),
    source,
  }));
}

// ── Font helpers ───────────────────────────────────────────────────────────────

interface RawFont {
  family: string;
  source: string;
}

function processFonts(raw: RawFont[]): BrandFont[] {
  const seen = new Set<string>();
  const result: BrandFont[] = [];

  for (const { family, source } of raw) {
    // Take the first font in the stack, strip quotes
    const primary = family.split(",")[0].trim().replace(/['"]/g, "");
    const normalized = primary.toLowerCase();
    if (!primary || seen.has(normalized)) continue;
    seen.add(normalized);

    const isSystem = SYSTEM_FONTS.has(normalized);

    const role: BrandFont["role"] =
      /h[123]|heading/.test(source) ? "heading" : /nav|button|ui/.test(source) ? "ui" : "body";

    result.push({ family: primary, role, source, isSystem });
  }

  return result;
}

// ── Main scrape function ───────────────────────────────────────────────────────

export async function scrapeBrand(url: string): Promise<BrandData> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Give JS frameworks time to hydrate
    await page.waitForTimeout(2000);

    const p = page as import("playwright-core").Page;
    const [rawColors, rawFonts, logo, brandName] = await Promise.all([
      extractColors(p),
      extractFonts(p),
      extractLogo(p),
      extractBrandName(p),
    ]);

    return {
      brandName,
      url,
      scrapedAt: new Date().toISOString(),
      colors: processColors(rawColors),
      fonts: processFonts(rawFonts),
      logo,
    };
  } finally {
    await context.close();
  }
}

// ── Extraction functions ───────────────────────────────────────────────────────

async function extractColors(page: import("playwright-core").Page): Promise<RawColor[]> {
  return page.evaluate((): RawColor[] => {
    const results: RawColor[] = [];

    // 1. CSS custom properties from :root
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
              for (const prop of Array.from(rule.style)) {
                if (prop.startsWith("--")) {
                  const val = rootStyle.getPropertyValue(prop).trim();
                  if (val) results.push({ value: val, source: prop });
                }
              }
            }
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
    } catch {
      // Skip
    }

    // 2. Computed colors from key elements
    const selectors = [
      "body",
      "header",
      "nav",
      "main",
      "h1",
      "h2",
      "button",
      "a",
      "footer",
      "[class*='hero']",
      "[class*='banner']",
      "[class*='primary']",
      "[class*='btn']",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        results.push({ value: cs.backgroundColor, source: `${sel}.background` });
      }
      if (cs.color) {
        results.push({ value: cs.color, source: `${sel}.color` });
      }
      if (cs.borderColor && cs.borderColor !== "rgba(0, 0, 0, 0)") {
        results.push({ value: cs.borderColor, source: `${sel}.border` });
      }
    }

    // 3. meta theme-color
    const themeEl = document.querySelector('meta[name="theme-color"]');
    if (themeEl) {
      const val = themeEl.getAttribute("content");
      if (val) results.push({ value: val, source: "meta[theme-color]" });
    }

    return results.filter((r) => r.value && r.value !== "");
  });
}

async function extractFonts(page: import("playwright-core").Page): Promise<RawFont[]> {
  return page.evaluate((): RawFont[] => {
    const results: RawFont[] = [];

    // 1. Google Fonts link tags
    const gfLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    for (const link of Array.from(gfLinks)) {
      const href = link.getAttribute("href") || "";
      const match = href.match(/family=([^&:]+)/);
      if (match) {
        const families = decodeURIComponent(match[1]).split("|");
        for (const f of families) {
          const name = f.split(":")[0].replace(/\+/g, " ").trim();
          if (name) results.push({ family: name, source: "Google Fonts link" });
        }
      }
    }

    // 2. Computed font-family from key elements
    const elementMap: [string, string][] = [
      ["body", "body"],
      ["h1", "h1 heading"],
      ["h2", "h2 heading"],
      ["h3", "h3 heading"],
      ["nav", "nav ui"],
      ["button", "button ui"],
    ];

    for (const [sel, src] of elementMap) {
      const el = document.querySelector(sel);
      if (el) {
        const ff = getComputedStyle(el).fontFamily;
        if (ff) results.push({ family: ff, source: `${src} computed` });
      }
    }

    return results;
  });
}

async function extractLogo(page: import("playwright-core").Page): Promise<BrandLogo | null> {
  return page.evaluate((): BrandLogo | null => {
    const origin = window.location.origin;

    const strategies: Array<{ selector: string; attr: string }> = [
      { selector: 'meta[property="og:image"]', attr: "content" },
      { selector: 'link[rel="apple-touch-icon"]', attr: "href" },
      { selector: 'img[class*="logo"]', attr: "src" },
      { selector: 'img[id*="logo"]', attr: "src" },
      { selector: 'img[alt*="logo" i]', attr: "src" },
      { selector: 'img[src*="logo"]', attr: "src" },
    ];

    for (const { selector, attr } of strategies) {
      const el = document.querySelector(selector);
      if (el) {
        const val = el.getAttribute(attr);
        if (val && val.trim()) {
          const url = val.startsWith("http")
            ? val
            : `${origin}${val.startsWith("/") ? "" : "/"}${val}`;
          return { url, source: selector };
        }
      }
    }

    // Fallback: first small img inside header/nav
    const headerImgs = Array.from(document.querySelectorAll("header img, nav img"));
    for (const img of headerImgs) {
      const el = img as HTMLImageElement;
      const w = el.naturalWidth;
      const h = el.naturalHeight;
      if (el.src && (w === 0 || (w < 400 && h < 200))) {
        return { url: el.src, source: "header/nav img heuristic" };
      }
    }

    return null;
  });
}

async function extractBrandName(page: import("playwright-core").Page): Promise<string> {
  return page.evaluate((): string => {
    const og = document.querySelector('meta[property="og:site_name"]');
    if (og?.getAttribute("content")) {
      return og.getAttribute("content")!.trim();
    }
    return document.title
      .split(/[|\-–—:]/)[0]
      .trim()
      .slice(0, 60);
  });
}
