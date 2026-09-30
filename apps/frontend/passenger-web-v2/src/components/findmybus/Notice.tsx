import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A calm block for "nothing here", "that failed" and "do this first": says what happened and what to do. */
export default function Notice({
  icon,
  title,
  children,
  actions,
  role,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <div role={role} className={cn("rounded-2xl border border-dashed border-border bg-card p-6 text-center md:p-10", className)}>
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-tint text-primary">{icon}</div>
      <h2 className="text-lg font-extrabold leading-snug">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">{actions}</div>}
    </div>
  );
}
