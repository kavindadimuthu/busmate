import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@busmate/ui/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
        success:
          "border-success/50 text-success dark:border-success [&>svg]:text-success",
        info:
          "border-primary/50 text-primary dark:border-primary [&>svg]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

// ── Convenience icon components ──────────────────────────
function AlertDestructiveIcon({ className, ...props }: React.ComponentProps<typeof AlertCircleIcon>) {
  return <AlertCircleIcon className={cn("size-4", className)} {...props} />
}

function AlertWarningIcon({ className, ...props }: React.ComponentProps<typeof AlertTriangleIcon>) {
  return <AlertTriangleIcon className={cn("size-4", className)} {...props} />
}

function AlertSuccessIcon({ className, ...props }: React.ComponentProps<typeof CheckCircle2Icon>) {
  return <CheckCircle2Icon className={cn("size-4", className)} {...props} />
}

function AlertInfoIcon({ className, ...props }: React.ComponentProps<typeof InfoIcon>) {
  return <InfoIcon className={cn("size-4", className)} {...props} />
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertDestructiveIcon,
  AlertWarningIcon,
  AlertSuccessIcon,
  AlertInfoIcon,
  alertVariants,
}
