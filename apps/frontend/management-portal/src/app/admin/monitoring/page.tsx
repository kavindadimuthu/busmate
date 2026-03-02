"use client"

import { useSetPageMetadata, useSetPageActions } from "@/context/PageContext"
import { MonitoringOverview } from "@/components/admin/monitoring"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"
import { Radio, RefreshCw } from "lucide-react"

export default function MonitoringPage() {
  useSetPageMetadata({
    title: "System Monitoring",
    description: "Overview of system health, performance, and alerts",
    activeItem: "monitoring",
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Monitoring' }],
  })

  const monitoring = useSystemMonitoring()

  useSetPageActions(
    <>
      <button
        onClick={monitoring.toggleLive}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          monitoring.isLive
            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100'
            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
        }`}
      >
        {/* <span className={`w-2 h-2 rounded-full ${monitoring.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} /> */}
        <Radio className={`h-3.5 w-3.5 ${monitoring.isLive ? 'animate-pulse' : ''}`} />
        {monitoring.isLive ? 'Live' : 'Paused'}
      </button>
      <button
        onClick={monitoring.refresh}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${monitoring.loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </>
  )

  return (
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
  )
}
