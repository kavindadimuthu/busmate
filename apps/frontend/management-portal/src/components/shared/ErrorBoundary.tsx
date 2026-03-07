'use client';

/**
 * Generic React Error Boundary for the management portal.
 *
 * React requires error boundaries to be class components.  This module
 * exports two things:
 *
 *   1. `ErrorBoundary`           – generic, accepts a custom `fallback` prop.
 *   2. `WorkspaceErrorFallback`  – a styled fallback component designed for
 *                                  the Route Workspace page.
 *
 * Usage:
 *   <ErrorBoundary fallback={<WorkspaceErrorFallback onReset={…} />}>
 *     <RouteWorkspaceProvider>…</RouteWorkspaceProvider>
 *   </ErrorBoundary>
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  /** Content to render when no error has occurred. */
  children: ReactNode;
  /**
   * Custom fallback UI to render when an error is caught.
   * Receives the caught error and a reset callback as render-prop arguments.
   */
  fallback?: (error: Error | null, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to the console for developer visibility.
    // In production this is where you'd forward to an error tracking service
    // (e.g. Sentry, Datadog RUM) via a simple `fetch` to a logging endpoint.
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo.componentStack);
  }

  reset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default minimal fallback (rarely shown — callers should provide one).
      return (
        <div className="flex flex-col items-center justify-center min-h-96 gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-slate-800">Something went wrong</h2>
          <p className="text-sm text-slate-500 max-w-md">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.reset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// WORKSPACE ERROR FALLBACK
// ============================================================================

interface WorkspaceErrorFallbackProps {
  /** The error that was caught by the boundary. */
  error: Error | null;
  /** Resets the error boundary state so the workspace is re-mounted. */
  onReset: () => void;
}

/**
 * A styled fallback UI for the Route Workspace page.
 *
 * Provides:
 *  - A human-readable description of what went wrong
 *  - A "Try Again" button that resets the error boundary
 *  - A "Go Back to Routes" link to escape the workspace entirely
 *  - Technical error details in development mode only
 */
export function WorkspaceErrorFallback({ error, onReset }: WorkspaceErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-5 flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-800">
              Route Workspace encountered an error
            </h2>
            <p className="mt-1 text-sm text-red-600">
              An unexpected error prevented the workspace from rendering. Your unsaved changes
              may have been lost. You can try to recover by clicking &ldquo;Try Again&rdquo;
              below.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <a
            href="/mot/routes"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Routes
          </a>
        </div>

        {/* Developer details (hidden in production) */}
        {isDev && error && (
          <details className="mx-6 mb-5 rounded-lg border border-slate-200 text-xs overflow-hidden">
            <summary className="px-4 py-2 bg-slate-50 cursor-pointer font-medium text-slate-700 select-none">
              Developer details
            </summary>
            <pre className="px-4 py-3 overflow-x-auto text-red-700 bg-red-50 leading-relaxed whitespace-pre-wrap break-words">
              {error.name}: {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
