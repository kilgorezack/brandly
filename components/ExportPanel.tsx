"use client";

import { useState } from "react";
import type { BrandData } from "@/types/brand";

function generateCSS(data: BrandData): string {
  const colorVars = data.colors
    .map((c, i) => {
      const name =
        i === 0 ? "primary" : i === 1 ? "secondary" : i === 2 ? "accent" : `brand-${i + 1}`;
      return `  --color-${name}: ${c.hex};`;
    })
    .join("\n");

  const fontVars = data.fonts
    .filter((f) => !f.isSystem)
    .map((f) => `  --font-${f.role}: '${f.family}', sans-serif;`)
    .join("\n");

  const lines = [":root {", colorVars, fontVars && "", fontVars, "}"]
    .filter((l) => l !== undefined && l !== null)
    .join("\n");

  return lines;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ data }: { data: BrandData }) {
  const [cssCopied, setCssCopied] = useState(false);

  const slug = data.brandName.replace(/\s+/g, "-").toLowerCase().slice(0, 30) || "brand";

  function handleCopyCSS() {
    const css = generateCSS(data);
    navigator.clipboard.writeText(css).catch(() => {});
    setCssCopied(true);
    setTimeout(() => setCssCopied(false), 2000);
  }

  function handleDownloadCSS() {
    downloadFile(generateCSS(data), `${slug}-tokens.css`, "text/css");
  }

  function handleDownloadJSON() {
    downloadFile(JSON.stringify(data, null, 2), `${slug}-brand.json`, "application/json");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleCopyCSS}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        </svg>
        {cssCopied ? "Copied!" : "Copy CSS Variables"}
      </button>

      <button
        onClick={handleDownloadCSS}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download CSS
      </button>

      <button
        onClick={handleDownloadJSON}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download JSON
      </button>
    </div>
  );
}
