"use client";

import { useState } from "react";
import type { BrandColor } from "@/types/brand";

function CopyButton({ hex, small = false }: { hex: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className={`rounded-md bg-black/10 font-mono text-white backdrop-blur-sm transition hover:bg-black/20 ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
    >
      {copied ? "Copied!" : hex.toUpperCase()}
    </button>
  );
}

function SmallSwatch({ color }: { color: BrandColor }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(color.hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md"
      onClick={copy}
    >
      <div className="h-14 w-full" style={{ backgroundColor: color.hex }} />
      <div className="bg-white px-2.5 py-2">
        <p className="font-mono text-xs font-semibold text-gray-900">
          {copied ? "Copied!" : color.hex.toUpperCase()}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-gray-400">{color.name}</p>
      </div>
    </div>
  );
}

export function ColorPalette({ colors }: { colors: BrandColor[] }) {
  if (colors.length === 0) {
    return <p className="text-sm text-gray-400">No colors extracted.</p>;
  }

  const [primary, ...rest] = colors;

  return (
    <div className="space-y-4">
      {/* Hero swatch — highest-scoring brand color */}
      <div
        className="relative flex h-36 w-full items-end overflow-hidden rounded-2xl p-4 shadow-sm"
        style={{ backgroundColor: primary.hex }}
      >
        <div className="flex w-full items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Primary
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">{primary.name}</p>
          </div>
          <CopyButton hex={primary.hex} />
        </div>
      </div>

      {/* Remaining swatches */}
      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {rest.map((color, i) => (
            <SmallSwatch key={i} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}
