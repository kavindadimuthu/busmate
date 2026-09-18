import type { ReactNode } from 'react';

/**
 * Plain form building blocks shared by the operator/MOT create-and-edit pages. Defined at module
 * level (never inside a component) so an input keeps focus while the parent re-renders.
 */

export const inputClass =
  'w-full px-3 py-2.5 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent disabled:bg-muted disabled:text-muted-foreground';

export function inputClassFor(error?: string): string {
  return `${inputClass} ${error ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`;
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  // The <label> wraps its control, so the control is named by the label text for assistive tech
  // without having to thread ids through every form.
  return (
    <div>
      <label className="block">
        <span className="block text-xs font-medium text-muted-foreground mb-1">
          {label} {required && <span className="text-destructive/80" aria-hidden>*</span>}
        </span>
        {children}
      </label>
      {error ? (
        <p className="text-xs text-destructive mt-1" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  icon,
  actions,
  children,
}: {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
      <p className="flex-1 text-sm text-destructive">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs text-destructive underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function ToneBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
