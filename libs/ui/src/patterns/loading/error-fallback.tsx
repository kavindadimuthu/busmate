"use client"

import * as React from "react"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/button"

interface ErrorFallbackProps {
  error?: Error | null
  title?: string
  description?: string
  onRetry?: () => void
  /** Injected automatically when used inside <ErrorBoundary> */
  resetErrorBoundary?: () => void
  className?: string
}

function ErrorFallback({
  error,
  title = "Something went wrong",
  description,
  onRetry,
  resetErrorBoundary,
  className,
}: ErrorFallbackProps) {
  const handleRetry = onRetry ?? resetErrorBoundary
  const message =
    description ??
    error?.message ??
    "An unexpected error occurred. Please try again."

  return (
    <div
      data-slot="error-fallback"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <AlertTriangleIcon
        className="size-10 text-destructive"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {handleRetry && (
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCwIcon />
          Try again
        </Button>
      )}
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <ErrorFallback
            error={this.state.error}
            resetErrorBoundary={this.reset}
          />
        )
      )
    }
    return this.props.children
  }
}

export { ErrorFallback, ErrorBoundary }
export type { ErrorFallbackProps, ErrorBoundaryProps }
