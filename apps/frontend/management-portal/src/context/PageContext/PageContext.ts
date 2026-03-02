import { createContext, type ReactNode } from "react"

// ── External store for page actions ──────────────────────────────
//
// Page actions are stored outside React state so that:
//  - Writing (setPageActions) never triggers a re-render of the *page*
//  - Reading (usePageActionsValue) only re-renders the header component
//    via useSyncExternalStore's fine-grained subscription model

function createPageActionsStore() {
  let current: ReactNode = undefined
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((l) => l())
  }

  return {
    set(actions: ReactNode) {
      current = actions
      notify()
    },
    clear() {
      current = undefined
      notify()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot(): ReactNode {
      return current
    },
  }
}

/** Singleton store — shared across all consumers in the module */
export const pageActionsStore = createPageActionsStore()

// ── Breadcrumb & Metadata types ───────────────────────────────────

/**
 * Breadcrumb item structure for page navigation
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Page metadata structure that can be set by individual pages
 */
export interface PageMetadata {
  /** Page title displayed in the header */
  title?: string
  /** Page description/subtitle displayed in the header */
  description?: string
  /** Active navigation item identifier */
  activeItem?: string
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /** Whether to show breadcrumbs */
  showBreadcrumbs?: boolean
  /** Whether to show home in breadcrumbs */
  showBreadcrumbHome?: boolean
  /** Custom page padding (default: 6) */
  padding?: number
  /** Additional metadata that can be used by specific pages */
  customData?: Record<string, unknown>
}

// ── Context value ─────────────────────────────────────────────────

/**
 * Combined context value for PageContext.
 * Manages both page metadata (title, breadcrumbs, etc.) and page actions
 * (header action buttons) in a single unified context.
 */
export interface PageContextValue {
  /** Current page metadata */
  metadata: PageMetadata
  /** Update page metadata (merges with existing metadata) */
  setMetadata: (metadata: Partial<PageMetadata>) => void
  /** Reset metadata to default values */
  resetMetadata: () => void
  /** Set the page-level action buttons rendered in the content header */
  setPageActions: (actions: ReactNode) => void
  /** Clear the page-level action buttons */
  clearPageActions: () => void
}

// ── Default values ────────────────────────────────────────────────

export const DEFAULT_METADATA: PageMetadata = {
  title: "Dashboard",
  description: "",
  activeItem: "dashboard",
  breadcrumbs: [],
  showBreadcrumbs: false,
  showBreadcrumbHome: true,
  padding: 6,
  customData: {},
}

// ── Context ───────────────────────────────────────────────────────

/**
 * PageContext — unified context for all page-level data.
 * Provides metadata management and page action controls in one place.
 */
export const PageContext = createContext<PageContextValue | undefined>(undefined)
