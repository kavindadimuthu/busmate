/**
 * PageContext Module
 *
 * Unified context for all page-level data and actions.
 * Manages page metadata (title, description, breadcrumbs, etc.) and
 * page-level action buttons from a single provider and set of hooks.
 *
 * Usage
 * ──────
 * 1. Wrap your layout with `<PageProvider>`.
 * 2. In page components, call `useSetPageMetadata(...)` and/or
 *    `useSetPageActions(...)` to declaratively push page-specific data.
 * 3. In header/layout components, call `usePageContext()` to read metadata
 *    and `usePageActionsValue()` to subscribe to action changes.
 */

export { PageProvider } from "./PageProvider"
export {
  usePageContext,
  useSetPageMetadata,
  useSetPageActions,
  usePageActionsValue,
} from "./usePageContext"
export {
  PageContext,
  DEFAULT_METADATA,
  pageActionsStore,
  type PageMetadata,
  type PageContextValue,
  type BreadcrumbItem,
} from "./PageContext"
