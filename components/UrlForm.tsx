"use client";

import { useState } from "react";
import type { BrandData } from "@/types/brand";

interface Props {
  onResult: (data: BrandData | null) => void;
  onError: (msg: string | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export function UrlForm({ onResult, onError, isLoading, setIsLoading }: Props) {
  const [url, setUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    onError(null);
    onResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || "Failed to scrape URL");
      } else {
        onResult(data);
      }
    } catch {
      onError("Network error — please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://stripe.com"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-0 transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
          disabled={isLoading}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Scanning
            </>
          ) : (
            "Extract"
          )}
        </button>
      </div>
    </form>
  );
}
