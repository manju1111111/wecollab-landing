import { clsx } from "clsx";
import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Soft gradient bleed from previous section */
  bleedTop?: boolean;
  bleedBottom?: boolean;
};

export function SectionShell({
  id,
  children,
  className,
  bleedTop = true,
  bleedBottom = true,
}: SectionShellProps) {
  return (
    <section id={id} className={clsx("relative isolate overflow-x-clip overflow-y-visible", className)}>
      {bleedTop ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px z-0 h-40 bg-gradient-to-b from-violet-200/35 via-fuchsia-100/20 to-transparent blur-3xl"
        />
      ) : null}
      {bleedBottom ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-48 translate-y-1/3 bg-gradient-to-t from-violet-200/30 via-indigo-100/15 to-transparent blur-3xl"
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
