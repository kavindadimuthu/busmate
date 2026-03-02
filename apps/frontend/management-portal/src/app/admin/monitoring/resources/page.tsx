"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { ResourceUsagePanel } from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"

export default function ResourceUsagePage() {
  useSetPageMetadata({
    title: "Resource Usage",
    description: "Monitor server resource utilization and trends",
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Resources' },
    ],
  })

  const monitoring = useSystemMonitoring({
    enablePerformance: false,
    enableApiMonitoring: false,
    enableAlerts: false,
  })

  return (
    <ResourceUsagePanel
      history={monitoring.resourceHistory}
      latest={monitoring.latestResource}
      loading={monitoring.loading}
      isLive={monitoring.isLive}
      lastRefresh={monitoring.lastRefresh}
      onToggleLive={monitoring.toggleLive}
      onRefresh={monitoring.refresh}
    />
  )
}
