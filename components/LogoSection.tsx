"use client";

import type { BrandLogo } from "@/types/brand";

export function LogoSection({ logo }: { logo: BrandLogo | null }) {
  if (!logo) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">No logo detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Light background */}
        <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg bg-white shadow-inner ring-1 ring-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.url}
            alt="Brand logo"
            className="max-h-20 max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        {/* Dark background */}
        <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.url}
            alt="Brand logo on dark"
            className="max-h-20 max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Source</p>
          <p className="mt-0.5 font-mono text-xs text-gray-700">{logo.source}</p>
          <p className="mt-2 text-xs font-medium text-gray-500">URL</p>
          <a
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block max-w-xs truncate text-xs text-blue-600 hover:underline"
          >
            {logo.url}
          </a>
        </div>
      </div>
    </div>
  );
}
