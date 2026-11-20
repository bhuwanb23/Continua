"use client";

import { useEffect } from "react";

/**
 * Truthful global failure state. No cached or fabricated content is rendered to
 * keep the screen populated when a route cannot be produced.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route failed", error.message);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h1 className="text-lg font-semibold">This view is unavailable</h1>
      <p className="text-sm">
        The requested data could not be read from the frozen demo cache. Nothing is being
        substituted or fabricated. Retry once, then switch to the local cached app or the recorded
        backup.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-amber-900 px-3 py-1.5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        Try again
      </button>
    </div>
  );
}
