"use client"

import { useSetPageMetadata } from "@/context/PageContext"
import { AlertsPanel } from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"

export default function AlertsPage() {
  useSetPageMetadata({
    title: "Alerts & Notifications",
    description: "Manage alert thresholds and view active alerts",
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Alerts' },
    ],
  })

  const monitoring = useSystemMonitoring({
    enablePerformance: false,
    enableResources: false,
    enableApiMonitoring: false,
  })

  return (
    <AlertsPanel
      alerts={monitoring.alerts}
      activeAlerts={monitoring.activeAlerts}
      alertRules={monitoring.alertRules}
      loading={monitoring.loading}
      onAcknowledgeAlert={monitoring.handleAcknowledgeAlert}
      onResolveAlert={monitoring.handleResolveAlert}
      onToggleRule={monitoring.handleToggleAlertRule}
    />
  )
}
