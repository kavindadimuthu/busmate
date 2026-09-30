import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { inputClass } from "@/components/auth/Field";
import { cn } from "@/lib/utils";

/** A label, the control, an optional hint and the problem with it, laid out the same way as every other field. */
function Frame({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** A multi-line box. 16px text so a phone doesn't zoom the page when it is focused. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, AreaProps>(function TextAreaField({ label, hint, error, id, className, ...props }, ref) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <Frame id={areaId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={!!error}
        aria-describedby={[hint ? `${areaId}-hint` : "", error ? `${areaId}-error` : ""].filter(Boolean).join(" ") || undefined}
        className={cn(inputClass(!!error), "min-h-28 py-3 leading-relaxed", className)}
        {...props}
      />
    </Frame>
  );
}) ;

/** One tick-box row, tall enough for a thumb: the whole row is the target, not just the box. */
export const CheckRow = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }>(function CheckRow({ children, className, ...props }, ref) {
  return (
    <label className={cn("flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-1 py-2.5 text-sm leading-snug", className)}>
      <input ref={ref} type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[hsl(var(--primary))]" {...props} />
      <span className="min-w-0">{children}</span>
    </label>
  );
});

/** A choice among a few, drawn as full-width cards so each is an easy tap. */
export const RadioCard = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }>(function RadioCard({ children, className, ...props }, ref) {
  return (
    <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-tint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}>
      <input ref={ref} type="radio" className="h-5 w-5 flex-none accent-[hsl(var(--primary))]" {...props} />
      <span className="min-w-0">{children}</span>
    </label>
  );
});
