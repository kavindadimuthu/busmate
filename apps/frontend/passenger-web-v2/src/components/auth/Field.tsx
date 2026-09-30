import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 48px tall with 16px text: tall enough for a thumb, and iOS won't zoom the page on focus. */
export const inputClass = (invalid: boolean) =>
  cn(
    "block min-h-12 w-full rounded-xl border bg-card px-4 text-base font-medium text-foreground outline-none transition-colors",
    "placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25",
    invalid ? "border-destructive" : "border-border",
  );

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelAside?: ReactNode;
}

function FieldFrame({
  id,
  label,
  error,
  labelAside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  labelAside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px] font-bold">
        <label htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, labelAside, id, className, ...props },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldFrame id={inputId} label={label} error={error} labelAside={labelAside}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(inputClass(!!error), className)}
        {...props}
      />
    </FieldFrame>
  );
});

/** A password box with a Show/Hide switch. Showing it beats a "confirm password" box on a phone:
 * one field to type, and the passenger can see a typo instead of guessing at dots. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type">>(function PasswordField(
  { label, error, labelAside, id, className, ...props },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <FieldFrame id={inputId} label={label} error={error} labelAside={labelAside}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={shown ? "text" : "password"}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(inputClass(!!error), "pr-[76px]", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={inputId}
          className="absolute right-1 top-1/2 min-h-11 -translate-y-1/2 rounded-lg px-3.5 text-xs font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </FieldFrame>
  );
});
