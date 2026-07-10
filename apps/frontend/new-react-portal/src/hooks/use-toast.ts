"use client"

/**
 * Compatibility shim: maps the legacy shadcn useToast() API to Sonner.
 * All call sites can keep using `const { toast } = useToast()` and
 * `toast({ title, description, variant })` unchanged.
 */
import type { ReactNode } from "react"
import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: ReactNode
  variant?: "default" | "destructive"
  duration?: number
}

function toast({ title = "", description, variant, duration }: ToastProps) {
  if (variant === "destructive") {
    sonnerToast.error(title, { description, duration })
  } else {
    sonnerToast(title, { description, duration })
  }
}

function useToast() {
  return { toast }
}

export { useToast, toast }
export type { ToastProps }

