import type { ReactNode } from "react";

/**
 * Presentation-only emphasis for a demo scene. Adds a highlight ring around
 * real product content; it never renders or rewrites data itself.
 */
export function DemoFocus({
  anchor,
  active,
  children,
}: {
  anchor: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-demo-focus={anchor}
      data-demo-active={active ? "true" : "false"}
      className={
        active
          ? "rounded-xl ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-50"
          : undefined
      }
    >
      {children}
    </div>
  );
}
