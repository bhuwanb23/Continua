"use client";

import { useEffect } from "react";
import { DemoProgress } from "@/components/demo/DemoProgress";

export function DemoController({
  scene,
  total,
  onPrev,
  onNext,
  onReset,
}: {
  scene: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "n" || event.key === "N") onNext();
      else if (event.key === "ArrowLeft" || event.key === "p" || event.key === "P") onPrev();
      else if (event.key === "r" || event.key === "R") onReset();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onReset]);

  return (
    <nav
      aria-label="Demo scenes"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg"
    >
      <DemoProgress scene={scene} total={total} />
      <button
        type="button"
        onClick={onPrev}
        disabled={scene <= 1}
        className="rounded-md px-2 py-1 text-sm text-slate-600 disabled:opacity-40"
        aria-label="Previous scene"
      >
        ←
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={scene >= total}
        className="rounded-md px-2 py-1 text-sm text-slate-600 disabled:opacity-40"
        aria-label="Next scene"
      >
        →
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
        aria-label="Reset demo to scene 1"
      >
        Reset
      </button>
    </nav>
  );
}
