export function DemoProgress({ scene, total }: { scene: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="font-semibold text-ink">
        Scene {scene}/{total}
      </span>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={scene}
        aria-label="Demo progress"
        className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${(scene / total) * 100}%` }} />
      </div>
    </div>
  );
}
