import type { Meta, StoryObj } from "@storybook/react"
import { LoadingSpinner } from "@busmate/ui/patterns/loading"
import { TableSkeleton } from "@busmate/ui/patterns/loading"
import { CardSkeleton } from "@busmate/ui/patterns/loading"
import { FormSkeleton } from "@busmate/ui/patterns/loading"
import { ErrorFallback } from "@busmate/ui/patterns/loading"

const meta: Meta = {
  title: "Patterns/Loading",
}

export default meta

// ── Spinner ───────────────────────────────────────────────

export const SpinnerSizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6 p-6">
      <LoadingSpinner size="xs" />
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="default" />
      <LoadingSpinner size="lg" />
      <LoadingSpinner size="xl" />
    </div>
  ),
}

export const SpinnerVariants: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6 p-6">
      <LoadingSpinner variant="default" />
      <LoadingSpinner variant="muted" />
      <span className="text-destructive">
        <LoadingSpinner variant="current" />
      </span>
    </div>
  ),
}

// ── Table Skeleton ────────────────────────────────────────

export const TableSkeletonDefault: StoryObj = {
  name: "TableSkeleton",
  render: () => (
    <div className="max-w-2xl p-6">
      <TableSkeleton rows={5} columns={4} />
    </div>
  ),
}

export const TableSkeletonNoHeader: StoryObj = {
  name: "TableSkeleton — No Header",
  render: () => (
    <div className="max-w-2xl p-6">
      <TableSkeleton rows={3} columns={3} showHeader={false} />
    </div>
  ),
}

// ── Card Skeleton ─────────────────────────────────────────

export const CardSkeletonVariants: StoryObj = {
  name: "CardSkeleton",
  render: () => (
    <div className="grid max-w-2xl grid-cols-3 gap-4 p-6">
      <CardSkeleton />
      <CardSkeleton showAvatar />
      <CardSkeleton showImage lines={2} />
    </div>
  ),
}

// ── Form Skeleton ─────────────────────────────────────────

export const FormSkeletonDefault: StoryObj = {
  name: "FormSkeleton — Single Column",
  render: () => (
    <div className="max-w-sm p-6">
      <FormSkeleton fields={4} columns={1} />
    </div>
  ),
}

export const FormSkeletonTwoCol: StoryObj = {
  name: "FormSkeleton — Two Columns",
  render: () => (
    <div className="max-w-lg p-6">
      <FormSkeleton fields={6} columns={2} />
    </div>
  ),
}

// ── Error Fallback ────────────────────────────────────────

export const ErrorFallbackDefault: StoryObj = {
  name: "ErrorFallback",
  render: () => (
    <div className="max-w-sm p-6">
      <ErrorFallback
        title="Failed to load routes"
        description="Could not connect to the BusMate API. Please check your connection."
        onRetry={() => alert("Retrying...")}
      />
    </div>
  ),
}

export const ErrorFallbackNoRetry: StoryObj = {
  name: "ErrorFallback — No Retry",
  render: () => (
    <div className="max-w-sm p-6">
      <ErrorFallback
        title="Access denied"
        description="You do not have permission to view this resource."
      />
    </div>
  ),
}
