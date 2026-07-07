import * as React from "react"
import { Skeleton } from "../../components/skeleton"
import { cn } from "../../lib/utils"

interface FormSkeletonProps {
  fields?: number
  columns?: 1 | 2 | 3
  showTitle?: boolean
  showDescription?: boolean
  className?: string
}

const gridColsMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const

function FormSkeleton({
  fields = 4,
  columns = 1,
  showTitle = true,
  showDescription = true,
  className,
}: FormSkeletonProps) {
  return (
    <div data-slot="form-skeleton" className={cn("space-y-6", className)}>
      {(showTitle || showDescription) && (
        <div className="space-y-2">
          {showTitle && <Skeleton className="h-6 w-48" />}
          {showDescription && <Skeleton className="h-4 w-72" />}
        </div>
      )}
      <div className={cn("grid gap-4", gridColsMap[columns])}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            {/* label */}
            <Skeleton className="h-4 w-24" />
            {/* input */}
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {/* submit button */}
        <Skeleton className="h-9 w-24" />
        {/* cancel button */}
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

export { FormSkeleton }
export type { FormSkeletonProps }
