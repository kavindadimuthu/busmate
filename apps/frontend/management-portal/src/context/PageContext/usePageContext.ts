"use client"

import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { PageContext, pageActionsStore, type PageMetadata } from "./PageContext"

// ── Core context hook ─────────────────────────────────────────────

/**
 * Access the full PageContext value.
 *
 * Returns `{ metadata, setMetadata, resetMetadata, setPageActions, clearPageActions }`.
 * Must be used within a `<PageProvider>`.
 *
 * @throws Error if called outside of a PageProvider
 *
 * @example
 * ```tsx
 * const { metadata, setMetadata } = usePageContext()
 * ```
 */
export function usePageContext() {
  const context = useContext(PageContext)

  if (context === undefined) {
    throw new Error("usePageContext must be used within a PageProvider")
  }

  return context
}

// ── Convenience setter hooks ──────────────────────────────────────

/**
 * Declaratively set page metadata when the component mounts.
 *
 * Pass a partial `PageMetadata` object; it is merged with the current
 * metadata on mount. Optionally resets to defaults on unmount.
 *
 * @param metadata - Metadata fields to apply
 * @param resetOnUnmount - Reset to defaults when the component unmounts (default: false)
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   useSetPageMetadata({
 *     title: "My Page",
 *     description: "A description",
 *     activeItem: "my-page",
 *   })
 *   return <div>Page content</div>
 * }
 * ```
 */
export function useSetPageMetadata(
  metadata: Partial<PageMetadata>,
  resetOnUnmount = false
) {
  const { setMetadata, resetMetadata } = usePageContext()

  useEffect(() => {
    setMetadata(metadata)

    if (resetOnUnmount) {
      return () => resetMetadata()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMetadata, resetMetadata, resetOnUnmount])
}

/**
 * Declaratively set the page-level action buttons shown in the content header.
 *
 * Uses an external store (via `useSyncExternalStore`) so that when actions
 * change, **only** the header component re-renders — the page component is
 * never re-rendered by this hook.
 *
 * `useLayoutEffect` without a dependency array re-runs after every render of
 * the calling page, keeping actions in sync with local page state (e.g. a
 * loading spinner inside an action button).
 *
 * @param actions - ReactNode containing the action buttons
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   useSetPageActions(
 *     <button onClick={handleSave}>Save</button>
 *   )
 *   return <div>Page content</div>
 * }
 * ```
 */
export function useSetPageActions(actions: ReactNode) {
  // Keep a ref so the layout-effect always reads the freshest value
  const actionsRef = useRef<ReactNode>(actions)
  actionsRef.current = actions

  // Push latest actions into the external store after every render.
  // Only the header subscribes via useSyncExternalStore, so only it re-renders.
  useLayoutEffect(() => {
    pageActionsStore.set(actionsRef.current)
  })

  // Clear when the component unmounts
  useEffect(() => {
    return () => pageActionsStore.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ── Read-only subscription hook ───────────────────────────────────

/**
 * Subscribe to the current page actions from the external store.
 *
 * This is intended for layout/header components that need to **render**
 * the actions. Only the calling component re-renders when actions change —
 * not the page that set them.
 *
 * @example
 * ```tsx
 * function ContentHeader() {
 *   const pageActions = usePageActionsValue()
 *   return <div>{pageActions}</div>
 * }
 * ```
 */
export function usePageActionsValue(): ReactNode {
  return useSyncExternalStore(
    pageActionsStore.subscribe,
    pageActionsStore.getSnapshot,
    pageActionsStore.getSnapshot // server snapshot (returns undefined/empty)
  )
}
