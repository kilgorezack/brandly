"use client";

import type { BrandData } from "@/types/brand";
import { ColorPalette } from "./ColorPalette";
import { FontSection } from "./FontSection";
import { ExportPanel } from "./ExportPanel";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
      {children}
    </div>
  );
}

export function BrandResults({ data }: { data: BrandData }) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.brandName}</h1>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            {data.url}
          </a>
        </div>
        <ExportPanel data={data} />
      </div>

      {/* Colors */}
      <Section title={`Colors · ${data.colors.length}`}>
        <ColorPalette colors={data.colors} />
      </Section>

      {/* Fonts */}
      <Section title={`Typography · ${data.fonts.length}`}>
        <FontSection fonts={data.fonts} />
      </Section>

      {/* Footer */}
      <p className="text-right text-xs text-gray-300">
        Scraped {new Date(data.scrapedAt).toLocaleString()}
      </p>
    </div>
  );
}
