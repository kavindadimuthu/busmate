"use client"

interface RevenueChartProps {
  title: string
  data: Array<{ label: string; value: number; color: string }>
}

export function RevenueChart({ title, data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map(item => item.value))

  // Sort data by value in descending order and take top 6 items for better visualization
  const sortedData = data.sort((a, b) => b.value - a.value).slice(0, 6)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {sortedData.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-24 text-sm text-gray-600 truncate" title={item.label}>{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            <div className="w-24 text-sm font-medium text-gray-900 text-right">
              {title.includes('Revenue') ? `Rs ${item.value.toLocaleString()}` : item.value.toLocaleString()}
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No data available for current filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
