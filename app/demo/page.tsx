import { Suspense } from "react";
import { DemoClient } from "@/components/demo/DemoClient";

export default function DemoPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading demo…</p>}>
      <DemoClient />
    </Suspense>
  );
}
