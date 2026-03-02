"use client"

import { useState, useCallback, useMemo, type ReactNode } from "react"
import { PageContext, DEFAULT_METADATA, pageActionsStore, type PageMetadata } from "./PageContext"

interface PageProviderProps {
  children: ReactNode
  /** Optional initial metadata values */
  initialMetadata?: Partial<PageMetadata>
}

/**
 * PageProvider Component
 *
 * Single provider that manages both page metadata and page action buttons.
 * Wrap your layout with this provider — individual pages consume it via the
 * `usePageContext`, `useSetPageMetadata`, and `useSetPageActions` hooks.
 *
 * The external store pattern keeps page-action updates from re-rendering the
 * page component; only the header subscribes to action changes.
 *
 * @example
 * ```tsx
 * <PageProvider>
 *   <YourLayout />
 * </PageProvider>
 * ```
 */
export function PageProvider({ children, initialMetadata }: PageProviderProps) {
  const [metadata, setMetadataState] = useState<PageMetadata>({
    ...DEFAULT_METADATA,
    ...initialMetadata,
  })

  /** Merge new metadata values with the existing state */
  const setMetadata = useCallback((newMetadata: Partial<PageMetadata>) => {
    setMetadataState((prev) => ({
      ...prev,
      ...newMetadata,
      // Deep-merge customData rather than replacing it
      customData: {
        ...prev.customData,
        ...newMetadata.customData,
      },
    }))
  }, [])

  /** Reset metadata back to defaults (+ initialMetadata overrides) */
  const resetMetadata = useCallback(() => {
    setMetadataState({ ...DEFAULT_METADATA, ...initialMetadata })
  }, [initialMetadata])

  /** Write page actions directly to the external store — no re-render on the page */
  const setPageActions = useCallback((actions: ReactNode) => {
    pageActionsStore.set(actions)
  }, [])

  /** Clear page actions from the external store */
  const clearPageActions = useCallback(() => {
    pageActionsStore.clear()
  }, [])

  const contextValue = useMemo(
    () => ({ metadata, setMetadata, resetMetadata, setPageActions, clearPageActions }),
    [metadata, setMetadata, resetMetadata, setPageActions, clearPageActions]
  )

  return (
    <PageContext.Provider value={contextValue}>
      {children}
    </PageContext.Provider>
  )
}
