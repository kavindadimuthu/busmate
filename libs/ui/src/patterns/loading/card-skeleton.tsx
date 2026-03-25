import * as React from "react"
import { Skeleton } from "../../components/skeleton"
import { cn } from "../../lib/utils"

interface CardSkeletonProps {
  showAvatar?: boolean
  showImage?: boolean
  lines?: number
  className?: string
}

function CardSkeleton({
  showAvatar = false,
  showImage = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn("space-y-3 rounded-lg border bg-card p-4", className)}
    >
      {showImage && <Skeleton className="h-40 w-full rounded-md" />}
      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === lines - 1 ? "w-[70%]" : "w-full")}
          />
        ))}
      </div>
    </div>
  )
}

export { CardSkeleton }
export type { CardSkeletonProps }
