"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { PerformanceMetrics } from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"

export default function PerformancePage() {
  useSetPageMetadata({
    title: "Performance Metrics",
    description: "Detailed CPU, memory, and response time analytics",
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Performance' },
    ],
  })

  const monitoring = useSystemMonitoring({
    enableApiMonitoring: false,
    enableAlerts: false,
  })

  return (
    <PerformanceMetrics
      history={monitoring.performanceHistory}
      latest={monitoring.latestPerformance}
      loading={monitoring.loading}
      isLive={monitoring.isLive}
      lastRefresh={monitoring.lastRefresh}
      onToggleLive={monitoring.toggleLive}
      onRefresh={monitoring.refresh}
    />
  )
}
