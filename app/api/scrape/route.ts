import { NextRequest, NextResponse } from "next/server";
import { scrapeBrand } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let normalized = url.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }

    // Validate URL
    try {
      new URL(normalized);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const data = await scrapeBrand(normalized);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[scrape] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
