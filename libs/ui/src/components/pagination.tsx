import * as React from "react"
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
} from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@busmate/ui/lib/utils"
import { buttonVariants } from "@busmate/ui/components/button"
import type { VariantProps } from "class-variance-authority"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  size?: VariantProps<typeof buttonVariants>["size"]
} & React.ComponentProps<"a"> & { asChild?: boolean }

function PaginationLink({
  className,
  isActive,
  size = "icon",
  asChild = false,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  showLabel = true,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { showLabel?: boolean }) {
  return (
    <PaginationLink
      data-slot="pagination-previous"
      aria-label="Go to previous page"
      size={showLabel ? "default" : "icon"}
      className={cn("gap-1", showLabel && "pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      {showLabel && <span>Previous</span>}
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  showLabel = true,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { showLabel?: boolean }) {
  return (
    <PaginationLink
      data-slot="pagination-next"
      aria-label="Go to next page"
      size={showLabel ? "default" : "icon"}
      className={cn("gap-1", showLabel && "pr-2.5", className)}
      {...props}
    >
      {showLabel && <span>Next</span>}
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  )
}

function PaginationFirst({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      data-slot="pagination-first"
      aria-label="Go to first page"
      size="icon"
      className={className}
      {...props}
    >
      <ChevronFirstIcon className="size-4" />
    </PaginationLink>
  )
}

function PaginationLast({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      data-slot="pagination-last"
      aria-label="Go to last page"
      size="icon"
      className={className}
      {...props}
    >
      <ChevronLastIcon className="size-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <EllipsisIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
}
