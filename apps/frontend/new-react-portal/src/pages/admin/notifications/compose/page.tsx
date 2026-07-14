"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { ComposeNotificationForm } from "@/components/admin/notifications"

export default function ComposeNotificationPage() {
  useSetPageMetadata({
    title: "Compose Notification",
    description: "Create and send notifications to users",
    activeItem: "notifications",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: "Notifications", href: "/admin/notifications" },
      { label: "Compose" },
    ]
  })

  return <ComposeNotificationForm />
}
