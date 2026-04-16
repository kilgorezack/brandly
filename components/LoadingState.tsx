"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🕵️", text: "Slipping past the cookie banner" },
  { icon: "👀", text: "Judging their font choices" },
  { icon: "📐", text: "Calculating the exact shade of corporate blue" },
  { icon: "🤝", text: "Making friends with the CSS" },
  { icon: "🙏", text: "Checking if Comic Sans was involved" },
  { icon: "🎨", text: "Stealing... I mean, borrowing brand inspiration" },
  { icon: "🔍", text: "Looking for a font that isn't Helvetica" },
  { icon: "🤔", text: "Wondering who approved that color" },
  { icon: "📋", text: "Filing a formal complaint about the hex codes" },
  { icon: "✨", text: "Memorizing the vibe" },
  { icon: "🎭", text: "Asking the logo if it's having a good day" },
  { icon: "🔢", text: "Converting RGB to hex for the 1000th time" },
];

export function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [visible, setVisible] = useState(true);

  // Cycle through steps every 2.2s with a fade
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
      {/* Shimmer bar */}
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
