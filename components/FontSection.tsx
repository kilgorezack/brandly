"use client";

import type { BrandFont } from "@/types/brand";

const ROLE_LABELS: Record<BrandFont["role"], string> = {
  heading: "Heading",
  body: "Body",
  ui: "UI",
};

const ROLE_COLORS: Record<BrandFont["role"], string> = {
  heading: "bg-purple-50 text-purple-700",
  body: "bg-blue-50 text-blue-700",
  ui: "bg-green-50 text-green-700",
};

function FontCard({ font }: { font: BrandFont }) {
  const gfFamily = font.source === "Google Fonts link" ? font.family : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      {gfFamily && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(gfFamily)}&display=swap');`,
          }}
        />
      )}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[font.role]}`}
        >
          {ROLE_LABELS[font.role]}
        </span>
        {font.isSystem && (
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
            System
          </span>
        )}
        {font.source === "Google Fonts link" && (
          <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
            Google Fonts
          </span>
        )}
      </div>
      <p
        className="mb-1 text-3xl leading-tight text-gray-900"
        style={{ fontFamily: `'${font.family}', sans-serif` }}
      >
        Aa
      </p>
      <p
        className="text-sm text-gray-600"
        style={{ fontFamily: `'${font.family}', sans-serif` }}
      >
        The quick brown fox
      </p>
      <p className="mt-3 font-mono text-xs text-gray-500">{font.family}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">{font.source}</p>
    </div>
  );
}

export function FontSection({ fonts }: { fonts: BrandFont[] }) {
  if (fonts.length === 0) {
    return <p className="text-sm text-gray-400">No fonts extracted.</p>;
  }

  const webFonts = fonts.filter((f) => !f.isSystem);
  const systemFonts = fonts.filter((f) => f.isSystem);

  return (
    <div className="space-y-4">
      {webFonts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {webFonts.map((font, i) => (
            <FontCard key={i} font={font} />
          ))}
        </div>
      )}
      {systemFonts.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            System Fonts
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {systemFonts.map((font, i) => (
              <FontCard key={i} font={font} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
