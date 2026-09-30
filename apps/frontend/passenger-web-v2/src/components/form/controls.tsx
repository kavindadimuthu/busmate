import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { inputClass } from "@/components/auth/Field";
import { cn } from "@/lib/utils";

/** A label, the control, an optional hint and the problem with it, laid out the same way as every other field. */
function Frame({ id, label, hint, error, aside, children }: { id: string; label: string; hint?: string; error?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px] font-bold">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
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
  /** Something small beside the label, such as a "Changed" tag. */
  aside?: ReactNode;
}

/** A multi-line box. 16px text so a phone doesn't zoom the page when it is focused. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, AreaProps>(function TextAreaField({ label, hint, error, aside, id, className, ...props }, ref) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <Frame id={areaId} label={label} hint={hint} error={error} aside={aside}>
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

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  /** The first, empty choice, e.g. "Not sure". */
  placeholder: string;
}

/** A native drop-down: on a phone it opens the device's own picker, which is easier to use than any custom one. */
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ label, hint, error, options, placeholder, id, className, ...props }, ref) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <Frame id={selectId} label={label} hint={hint} error={error}>
      <select ref={ref} id={selectId} aria-invalid={!!error} className={cn(inputClass(!!error), "appearance-auto", className)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Frame>
  );
});
