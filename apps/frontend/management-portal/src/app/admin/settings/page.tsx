"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { SettingsTabLayout } from "@/components/admin/settings"

export default function SettingsPage() {
  useSetPageMetadata({
    title: "System Settings",
    description: "Configure general settings, API, maintenance, and backup options",
    activeItem: "settings",
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Settings' }],
  })

  return <SettingsTabLayout />
}
