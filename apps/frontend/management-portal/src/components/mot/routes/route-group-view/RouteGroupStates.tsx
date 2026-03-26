'use client';

import { RefreshCw, AlertCircle } from 'lucide-react';

interface RouteGroupLoadingSkeletonProps {}

export function RouteGroupLoadingSkeleton({}: RouteGroupLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-pulse">
        <div className="h-2 bg-secondary" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-secondary rounded-xl" />
            <div className="flex-1">
              <div className="h-7 w-48 bg-secondary rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-secondary rounded-lg" />
              <div className="h-3 w-16 bg-secondary rounded" />
            </div>
            <div className="h-6 w-20 bg-secondary rounded mb-2" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Route selector skeleton */}
      <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-16 flex-1 bg-muted rounded-lg" />
          <div className="h-16 flex-1 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="flex gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted rounded" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

interface RouteGroupErrorStateProps {
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function RouteGroupErrorState({ error, onRetry, onBack }: RouteGroupErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-destructive/80" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {error || 'Route group not found'}
      </h3>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        We couldn&apos;t load the route group details. This might be due to a network issue or the route group may have been deleted.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-foreground/80 bg-card border border-border rounded-lg hover:bg-muted transition-colors font-medium"
        >
          Back to Routes
        </button>
      </div>
    </div>
  );
}

interface RouteGroupEmptyRoutesProps {
  onAddRoutes: () => void;
}

export function RouteGroupEmptyRoutes({ onAddRoutes }: RouteGroupEmptyRoutesProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-12">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/70">
            <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Routes Defined</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          This route group doesn&apos;t have any routes yet. Add outbound and inbound routes to complete the route group.
        </p>
        <button
          onClick={onAddRoutes}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium"
        >
          Add Routes
        </button>
      </div>
    </div>
  );
}
