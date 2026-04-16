"use client";

import { useState } from "react";
import type { BrandColor } from "@/types/brand";

// ── Color format conversions ───────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const k = 1 - Math.max(r1, g1, b1);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r1 - k) / (1 - k)) * 100),
    m: Math.round(((1 - g1 - k) / (1 - k)) * 100),
    y: Math.round(((1 - b1 - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function isLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

// ── Copy pill ─────────────────────────────────────────────────────────────────

function CopyPill({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-1.5 text-left transition-colors hover:text-gray-900"
      title={`Copy ${label}`}
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      <span className="font-mono text-xs text-gray-600 group-hover:text-gray-900">
        {copied ? "Copied!" : value}
      </span>
    </button>
  );
}

// ── Swatch pill ───────────────────────────────────────────────────────────────

function SwatchPill({ hex, size = "md" }: { hex: string; size?: "sm" | "md" }) {
  const light = isLight(hex);
  const sizeClass = size === "sm" ? "px-3 py-2 text-xs min-w-[5.5rem]" : "px-4 py-3 text-sm min-w-[7rem]";
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl ${sizeClass} ${light ? "border border-gray-200" : ""}`}
      style={{ backgroundColor: hex }}
    >
      <span className={`font-mono font-semibold ${light ? "text-gray-700" : "text-white"}`}>
        {hex.toUpperCase()}
      </span>
    </div>
  );
}

// ── Desktop table row ─────────────────────────────────────────────────────────

function ColorRow({ color, isPrimary }: { color: BrandColor; isPrimary?: boolean }) {
  const { r, g, b } = hexToRgb(color.hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const { c, m, y, k } = rgbToCmyk(r, g, b);

  return (
    <tr className="border-t border-gray-100">
      <td className="py-4 pl-5 pr-4"><SwatchPill hex={color.hex} /></td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {isPrimary && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Primary
            </span>
          )}
          <span className="font-semibold text-gray-800">{color.name}</span>
        </div>
      </td>
      <td className="px-4 py-4"><CopyPill label="RGB" value={`${r}, ${g}, ${b}`} /></td>
      <td className="px-4 py-4"><CopyPill label="HSL" value={`${h}, ${s}, ${l}`} /></td>
      <td className="px-5 py-4"><CopyPill label="CMYK" value={`${c}, ${m}, ${y}, ${k}`} /></td>
    </tr>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function ColorCard({ color, isPrimary }: { color: BrandColor; isPrimary?: boolean }) {
  const { r, g, b } = hexToRgb(color.hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const { c, m, y, k } = rgbToCmyk(r, g, b);

  return (
    <div className="border-t border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <SwatchPill hex={color.hex} size="sm" />
        <div>
          {isPrimary && (
            <span className="mb-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Primary
            </span>
          )}
          <p className="font-semibold text-gray-800">{color.name}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">RGB</p>
          <CopyPill label="RGB" value={`${r}, ${g}, ${b}`} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">HSL</p>
          <CopyPill label="HSL" value={`${h}, ${s}, ${l}`} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">CMYK</p>
          <CopyPill label="CMYK" value={`${c}, ${m}, ${y}, ${k}`} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ColorPalette({ colors }: { colors: BrandColor[] }) {
  if (colors.length === 0) {
    return <p className="text-sm text-gray-400">No colors extracted.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Desktop table */}
      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-3 pl-5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Hex Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Color name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">RGB</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">HSL</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">CMYK</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((color, i) => (
            <ColorRow key={i} color={color} isPrimary={i === 0} />
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden">
        <div className="bg-gray-50 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Colors</p>
        </div>
        {colors.map((color, i) => (
          <ColorCard key={i} color={color} isPrimary={i === 0} />
        ))}
      </div>
    </div>
  );
}
