"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "⚡", text: "Launching headless browser" },
  { icon: "🌐", text: "Navigating to your URL" },
  { icon: "⏳", text: "Waiting for JavaScript to hydrate" },
  { icon: "🎨", text: "Scanning CSS stylesheets" },
  { icon: "🖌️", text: "Extracting color palette" },
  { icon: "🔤", text: "Detecting fonts" },
  { icon: "🖼️", text: "Hunting for the logo" },
  { icon: "🔬", text: "Clustering similar colors" },
  { icon: "✨", text: "Polishing results" },
];

export function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [visible, setVisible] = useState(true);

  // Cycle through steps every 2.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIndex((i) => (i + 1) % STEPS.length);
        setVisible(true);
      }, 200);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Animate trailing dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const step = STEPS[stepIndex];

  return (
    <div className="mt-8 flex flex-col items-center gap-5">
      {/* Spinner bar */}
      <div className="relative h-0.5 w-48 overflow-hidden rounded-full bg-gray-100">
        <div className="animate-shimmer absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
      </div>

      {/* Step message */}
      <div
        className="flex items-center gap-2 text-sm text-gray-500 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="text-base leading-none">{step.icon}</span>
        <span className="font-mono">
          {step.text}
          <span className="inline-block w-5 text-left">{dots}</span>
        </span>
      </div>
    </div>
  );
}
