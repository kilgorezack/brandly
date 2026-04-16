"use client";

import { useState } from "react";
import type { BrandData } from "@/types/brand";
import { UrlForm } from "@/components/UrlForm";
import { BrandResults } from "@/components/BrandResults";

export default function Home() {
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="border-b border-gray-100 bg-white px-6 py-12 shadow-sm">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Headless browser · Instant extraction
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            Brand asset extractor
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Paste any URL to extract colors, fonts, and logos instantly.
          </p>

          <div className="mt-8">
            <UrlForm
              onResult={setBrandData}
              onError={setError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-6 space-y-1 text-sm text-gray-400">
              <p>Launching headless browser…</p>
              <p className="text-xs">This can take 5–15 seconds</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {brandData && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <BrandResults data={brandData} />
        </div>
      )}

      {/* Empty state */}
      {!brandData && !isLoading && (
        <div className="mx-auto mt-16 max-w-lg px-6 text-center">
          <div className="grid grid-cols-3 gap-3 opacity-30">
            {["#E94560", "#0F3460", "#16213E", "#533483", "#2EC4B6", "#E71D36"].map((hex) => (
              <div key={hex} className="h-12 rounded-lg" style={{ backgroundColor: hex }} />
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Results will appear here — colors, fonts, logo, and export options.
          </p>
        </div>
      )}
    </div>
  );
}
