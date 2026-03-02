'use client';

import { Breadcrumb } from '@/components/shared/breadcrumb';
import type { PageMetadata } from '@/context/PageContext';
import { usePageActionsValue } from '@/context/PageContext';

interface TimekeeperContentHeaderProps {
  metadata: PageMetadata;
}

/**
 * Timekeeper Content Header
 *
 * Renders breadcrumbs, page title, description, and page-level action buttons.
 *
 * Actions are read via `usePageActionsValue` which subscribes to the external
 * store — only this component re-renders when actions change, never the page.
 */
export function TimekeeperContentHeader({ metadata }: TimekeeperContentHeaderProps) {
  // Subscribe to the external store — re-renders ONLY this component
  const pageActions = usePageActionsValue();

  const showBreadcrumbs =
    metadata.showBreadcrumbs &&
    metadata.breadcrumbs &&
    metadata.breadcrumbs.length > 0;

  const hasTitle = !!metadata.title;
  const hasActions = !!pageActions;

  if (!showBreadcrumbs && !hasTitle) return null;

  return (
    <div className="">
      {showBreadcrumbs && (
        <Breadcrumb
          items={metadata.breadcrumbs!}
          showHome={metadata.showBreadcrumbHome ?? true}
          className="border-b-0"
        />
      )}

      {hasTitle && (
        <div className="px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {metadata.title}
            </h1>
            {metadata.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {metadata.description}
              </p>
            )}
          </div>

          {hasActions && (
            <div className="flex items-center gap-2 shrink-0">
              {pageActions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
