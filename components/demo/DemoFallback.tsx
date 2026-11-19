import { FLAGSHIP_PATIENT_ID } from "@/lib/demo/flagship";
import type { DemoCheck } from "@/lib/demo/validate";

/**
 * Shown when the flagship path can't be read from the frozen API. It is an
 * honest "switch path" message, not a substitute rendering of missing data.
 */
export function DemoFallback({
  reason,
  checks,
  onRetry,
}: {
  reason: string;
  checks?: DemoCheck[];
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900"
    >
      <h2 className="text-lg font-semibold">Flagship data unavailable</h2>
      <p className="mt-2 text-sm">{reason}</p>
      <p className="mt-2 text-sm">
        Do not narrate around missing data. Reset, retry, then switch to the local cached app or
        the recorded backup.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-amber-900 px-3 py-1.5 font-medium text-white"
        >
          Retry preflight
        </button>
        <a
          href={`/patients/${FLAGSHIP_PATIENT_ID}`}
          className="rounded-md border border-amber-400 px-3 py-1.5 font-medium"
        >
          Open patient workspace
        </a>
        <a href="/evaluation" className="rounded-md border border-amber-400 px-3 py-1.5 font-medium">
          Open evaluation
        </a>
      </div>
      {checks ? (
        <ul className="mt-4 space-y-1 text-xs">
          {checks.map((check) => (
            <li key={check.name}>
              {check.ok ? "PASS" : "FAIL"} · {check.name} · {check.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
