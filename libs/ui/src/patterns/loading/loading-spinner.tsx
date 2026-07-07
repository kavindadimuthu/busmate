import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const loadingSpinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
    variant: {
      default: "text-primary",
      muted: "text-muted-foreground",
      current: "text-current",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
})

interface LoadingSpinnerProps
  extends React.ComponentProps<"svg">,
    VariantProps<typeof loadingSpinnerVariants> {
  srLabel?: string
}

function LoadingSpinner({
  className,
  size,
  variant,
  srLabel = "Loading...",
  ...props
}: LoadingSpinnerProps) {
  return (
    <Loader2Icon
      data-slot="loading-spinner"
      aria-label={srLabel}
      role="status"
      className={cn(loadingSpinnerVariants({ size, variant }), className)}
      {...props}
    />
  )
}

export { LoadingSpinner, loadingSpinnerVariants }
export type { LoadingSpinnerProps }
