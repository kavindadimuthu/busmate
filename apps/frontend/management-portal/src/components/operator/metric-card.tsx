import type React from "react"
import { TrendingUp, AlertTriangle } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: string
    type: "positive" | "negative" | "warning"
    label: string
  }
  icon: React.ReactNode
  borderColor?: string
  warning?: boolean
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  borderColor = "border-l-blue-500",
  warning = false,
}: MetricCardProps) {
  const getTrendColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      case "warning":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  const getTrendIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <TrendingUp className="w-3 h-3" />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>

          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor(trend.type)}`}>
              {getTrendIcon(trend.type)}
              <span className="font-medium">{trend.value}</span>
              {trend.label && <span>{trend.label}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
