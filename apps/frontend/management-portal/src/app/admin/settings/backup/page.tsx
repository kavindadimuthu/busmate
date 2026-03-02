"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { BackupSettingsPanel } from "@/components/admin/settings"

export default function BackupPage() {
  useSetPageMetadata({
    title: "Backup & Recovery",
    description: "Manage system backups, restore points, and disaster recovery",
    activeItem: "settings",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: "Settings", href: "/admin/settings" },
      { label: "Backup & Recovery" },
    ],
  })

  return <BackupSettingsPanel />
}
