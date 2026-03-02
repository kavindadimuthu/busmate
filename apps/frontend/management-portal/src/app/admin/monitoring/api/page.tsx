"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { ApiMonitoringPanel } from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"

export default function ApiMonitoringPage() {
  useSetPageMetadata({
    title: "API Monitoring",
    description: "Track API endpoint performance and microservice health",
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'API' },
    ],
  })

  const monitoring = useSystemMonitoring({
    enablePerformance: false,
    enableResources: false,
  })

  return (
    <ApiMonitoringPanel
      apiEndpoints={monitoring.apiEndpoints}
      microservices={monitoring.microservices}
      loading={monitoring.loading}
      onRestartService={monitoring.handleRestartService}
    />
  )
}
