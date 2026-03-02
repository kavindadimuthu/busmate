"use client"

import { useState, type ReactNode, type ComponentType } from "react"
import { SidebarClient } from "@/components/shared/SidebarClient"
import { PageProvider, usePageContext } from "@/context/PageContext"
import { type PageMetadata } from "@/context/PageContext/PageContext"
import { AdminContentHeader } from "@/components/admin/AdminContentHeader"
import { MotContentHeader } from "@/components/mot/MotContentHeader"
import { OperatorContentHeader } from "@/components/operator/OperatorContentHeader"
import { TimekeeperContentHeader } from "@/components/timekeeper/TimekeeperContentHeader"
import UserData from "@/types/UserData"

// ── Role configuration ────────────────────────────────────────────────────────
//
// Centralised map of role → { ContentHeader, defaultMetadata }.
// Adding a new role only requires an entry here; no other file changes needed.

type RoleHeader = ComponentType<{ metadata: PageMetadata }>

interface RoleConfig {
  ContentHeader: RoleHeader
  defaultMetadata: Partial<PageMetadata>
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  admin: {
    ContentHeader: AdminContentHeader,
    defaultMetadata: {
      title: "Dashboard",
      description: "Monitor system performance, user activity, and key metrics",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  mot: {
    ContentHeader: MotContentHeader,
    defaultMetadata: {
      title: "Dashboard",
      description: "Comprehensive overview of the transport management system",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  operator: {
    ContentHeader: OperatorContentHeader,
    defaultMetadata: {
      title: "Dashboard",
      description: "Comprehensive overview of your fleet operations, revenue, and performance metrics",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  timeKeeper: {
    ContentHeader: TimekeeperContentHeader,
    defaultMetadata: {
      title: "Dashboard",
      description: "",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LayoutClientProps {
  children: ReactNode
  userData: UserData | null
  /**
   * Role identifier — must match a key in ROLE_CONFIG.
   * Serialisable (string), so it is safe to pass from a Server Component.
   */
  role: keyof typeof ROLE_CONFIG
  /** Override any of the role's default metadata values. */
  initialMetadata?: Partial<PageMetadata>
}

// ── Inner content (consumes PageContext) ──────────────────────────────────────

interface LayoutContentProps {
  children: ReactNode
  userData: UserData | null
  role: string
  ContentHeader: RoleHeader
}

function LayoutContent({ children, userData, role, ContentHeader }: LayoutContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { metadata } = usePageContext()

  const padding = metadata.padding ?? 6
  const paddingClass = `p-${padding}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarClient
        activeItem={metadata.activeItem || "dashboard"}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        role={role}
        userData={userData}
      />

      {/* Main content area — shifts right based on sidebar width */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-20" : "ml-68"
        } min-h-screen flex flex-col`}
      >
        {/* Role-specific content header (breadcrumbs, title, actions) */}
        <ContentHeader metadata={metadata} />

        {/* Page content */}
        <main className={`flex-1 ${paddingClass}`}>{children}</main>
      </div>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Shared Layout Client Component
 *
 * Single source of truth for the common role-dashboard shell:
 * sidebar + role-specific content header + page body.
 *
 * Accepts only a serialisable `role` string, making it safe to render
 * directly from Next.js Server Component layouts without an intermediate
 * client wrapper file.
 *
 * Role-specific header components and default metadata are resolved
 * internally via ROLE_CONFIG. Pass `initialMetadata` to override defaults.
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx  (Server Component)
 * import { LayoutClient } from "@/components/shared/LayoutClient"
 *
 * export default async function AdminLayout({ children }) {
 *   const userData = await getUserData()
 *   return (
 *     <LayoutClient role="admin" userData={userData}>
 *       {children}
 *     </LayoutClient>
 *   )
 * }
 * ```
 */
export function LayoutClient({ children, userData, role, initialMetadata }: LayoutClientProps) {
  const config = ROLE_CONFIG[role]

  if (!config) {
    throw new Error(`LayoutClient: unknown role "${role}". Add it to ROLE_CONFIG in LayoutClient.tsx.`)
  }

  const { ContentHeader, defaultMetadata } = config

  return (
    <PageProvider initialMetadata={{ ...defaultMetadata, ...initialMetadata }}>
      <LayoutContent role={role} userData={userData} ContentHeader={ContentHeader}>
        {children}
      </LayoutContent>
    </PageProvider>
  )
}
