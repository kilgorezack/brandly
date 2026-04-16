"use client";

import { useState } from "react";
import type { BrandColor } from "@/types/brand";

function ColorSwatch({ color }: { color: BrandColor }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(color.hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md">
      <div
        className="h-20 w-full cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: color.hex }}
        onClick={copy}
        title={`Click to copy ${color.hex}`}
      />
      <div className="bg-white p-3">
        <p className="font-mono text-xs font-semibold text-gray-900">{color.hex.toUpperCase()}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{color.name}</p>
        <p className="mt-1 truncate text-[10px] text-gray-400">{color.source}</p>
        <button
          onClick={copy}
          className="mt-2 w-full rounded-md bg-gray-50 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
        >
          {copied ? "Copied!" : "Copy hex"}
        </button>
      </div>
    </div>
  );
}

export function ColorPalette({ colors }: { colors: BrandColor[] }) {
  if (colors.length === 0) {
    return <p className="text-sm text-gray-400">No colors extracted.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {colors.map((color, i) => (
        <ColorSwatch key={i} color={color} />
      ))}
    </div>
  );
}
