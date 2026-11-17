export default function EvaluationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Evaluation</h1>
      <p className="max-w-2xl text-slate-700">
        The frozen benchmark manifest exists, but the pipeline has not run.
        Evaluation status is <code className="rounded bg-slate-100 px-1">not_run</code>;
        no metrics are reported until they are measured.
      </p>
    </div>
  );
}
