import { clsx } from "clsx";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/70 bg-white/55 shadow-[0_8px_40px_-12px_rgba(124,58,237,0.18)] backdrop-blur-xl",
        hover &&
          "transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.22)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
