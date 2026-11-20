import type { ReactNode } from "react";

export function Drawer({ children, open }: { children: ReactNode; open: boolean }) {
  if (!open) return null;
  return <aside className="fixed right-0 top-0 h-full w-full max-w-xl overflow-auto border-l border-slate-200 bg-white p-6 shadow-xl">{children}</aside>;
}
