"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSetPageMetadata, useSetPageActions } from "@/context/PageContext"
import {
  MonitoringOverview,
  MonitoringTabs,
  PerformanceMetrics,
  ResourceUsagePanel,
  AlertsPanel,
  ApiMonitoringPanel,
} from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"
import { Button } from "@busmate/ui"
import { Radio, RefreshCw } from "lucide-react"

const TAB_META: Record<string, { title: string; description: string }> = {
  overview: {
    title: 'System Monitoring',
    description: 'Overview of system health, performance, and alerts',
  },
  performance: {
    title: 'Performance Metrics',
    description: 'Detailed CPU, memory, and response time analytics',
  },
  resources: {
    title: 'Resource Usage',
    description: 'Monitor server resource utilization and trends',
  },
  alerts: {
    title: 'Alerts & Notifications',
    description: 'Manage alert thresholds and view active alerts',
  },
  api: {
    title: 'API Monitoring',
    description: 'Track API endpoint performance and microservice health',
  },
}

function MonitoringContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'overview'
  const meta = TAB_META[activeTab] ?? TAB_META.overview

  useSetPageMetadata({
    title: meta.title,
    description: meta.description,
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Monitoring' }],
  })

  const monitoring = useSystemMonitoring()

  useSetPageActions(
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={monitoring.toggleLive}
        className={
          monitoring.isLive
            ? 'bg-success/15 text-success border-success/20 hover:bg-success/20 hover:text-success'
            : ''
        }
      >
        <Radio className={`h-3.5 w-3.5 ${monitoring.isLive ? 'animate-pulse' : ''}`} />
        {monitoring.isLive ? 'Live' : 'Paused'}
      </Button>
      <Button variant="outline" size="sm" onClick={monitoring.refresh}>
        <RefreshCw className={`h-3.5 w-3.5 ${monitoring.loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </>
  )

  return (
    <div className="space-y-6">
      <MonitoringTabs />

      {activeTab === 'overview' && (
        <MonitoringOverview
          healthSummary={monitoring.healthSummary}
          latestPerformance={monitoring.latestPerformance}
          performanceHistory={monitoring.performanceHistory}
          latestResource={monitoring.latestResource}
          apiEndpoints={monitoring.apiEndpoints}
          microservices={monitoring.microservices}
          activeAlerts={monitoring.activeAlerts}
          loading={monitoring.loading}
          isLive={monitoring.isLive}
          lastRefresh={monitoring.lastRefresh}
        />
      )}

      {activeTab === 'performance' && (
        <PerformanceMetrics
          history={monitoring.performanceHistory}
          latest={monitoring.latestPerformance}
          loading={monitoring.loading}
          isLive={monitoring.isLive}
          lastRefresh={monitoring.lastRefresh}
        />
      )}

      {activeTab === 'resources' && (
        <ResourceUsagePanel
          history={monitoring.resourceHistory}
          latest={monitoring.latestResource}
          loading={monitoring.loading}
          isLive={monitoring.isLive}
          lastRefresh={monitoring.lastRefresh}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsPanel
          alerts={monitoring.alerts}
          activeAlerts={monitoring.activeAlerts}
          alertRules={monitoring.alertRules}
          loading={monitoring.loading}
          onAcknowledgeAlert={monitoring.handleAcknowledgeAlert}
          onResolveAlert={monitoring.handleResolveAlert}
          onToggleRule={monitoring.handleToggleAlertRule}
        />
      )}

      {activeTab === 'api' && (
        <ApiMonitoringPanel
          apiEndpoints={monitoring.apiEndpoints}
          microservices={monitoring.microservices}
          loading={monitoring.loading}
          onRestartService={monitoring.handleRestartService}
        />
      )}
    </div>
  )
}

export default function MonitoringPage() {
  return (
    <Suspense>
      <MonitoringContent />
    </Suspense>
  )
}
