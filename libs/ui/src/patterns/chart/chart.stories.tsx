import type { Meta, StoryObj } from "@storybook/react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@busmate/ui/patterns/chart"
import type { ChartConfig } from "@busmate/ui/patterns/chart"

const meta: Meta = {
  title: "Patterns/Chart",
  parameters: {
    // Fullscreen gives charts a defined viewport width so aspect-ratio
    // can compute a pixel height for ResponsiveContainer
    layout: "fullscreen",
  },
}

export default meta

// ── Bar Chart ─────────────────────────────────────────────

const ridershipData = [
  { month: "Jan", boardings: 4200, alightings: 3800 },
  { month: "Feb", boardings: 3800, alightings: 3400 },
  { month: "Mar", boardings: 5100, alightings: 4700 },
  { month: "Apr", boardings: 4700, alightings: 4200 },
  { month: "May", boardings: 5600, alightings: 5100 },
  { month: "Jun", boardings: 6200, alightings: 5700 },
]

const barChartConfig: ChartConfig = {
  boardings: { label: "Boardings", color: "var(--color-chart-1)" },
  alightings: { label: "Alightings", color: "var(--color-chart-2)" },
}

export const BarChartExample: StoryObj = {
  render: () => (
    <div className="w-full p-6">
      <ChartContainer config={barChartConfig} className="max-w-2xl">
        <BarChart data={ridershipData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="boardings" fill="var(--color-boardings)" radius={4} />
          <Bar dataKey="alightings" fill="var(--color-alightings)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
}

// ── Line Chart ────────────────────────────────────────────

const trendData = [
  { week: "W1", routes: 42, incidents: 3 },
  { week: "W2", routes: 44, incidents: 5 },
  { week: "W3", routes: 43, incidents: 2 },
  { week: "W4", routes: 47, incidents: 4 },
  { week: "W5", routes: 46, incidents: 1 },
  { week: "W6", routes: 50, incidents: 6 },
  { week: "W7", routes: 52, incidents: 2 },
  { week: "W8", routes: 51, incidents: 3 },
]

const lineChartConfig: ChartConfig = {
  routes: { label: "Active Routes", color: "var(--color-chart-1)" },
  incidents: { label: "Incidents", color: "var(--color-chart-3)" },
}

export const LineChartExample: StoryObj = {
  render: () => (
    <div className="w-full p-6">
      <ChartContainer config={lineChartConfig} className="max-w-2xl">
        <LineChart data={trendData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="routes"
            stroke="var(--color-routes)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="incidents"
            stroke="var(--color-incidents)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ChartContainer>
    </div>
  ),
}

// ── Area Chart ────────────────────────────────────────────

const areaData = [
  { month: "Jul", passengers: 12400 },
  { month: "Aug", passengers: 14800 },
  { month: "Sep", passengers: 16200 },
  { month: "Oct", passengers: 15100 },
  { month: "Nov", passengers: 17800 },
  { month: "Dec", passengers: 20300 },
]

const areaChartConfig: ChartConfig = {
  passengers: { label: "Total Passengers", color: "var(--color-chart-1)" },
}

export const AreaChartExample: StoryObj = {
  render: () => (
    <div className="w-full p-6">
      <ChartContainer config={areaChartConfig} className="max-w-2xl">
        <AreaChart data={areaData}>
          <defs>
            <linearGradient id="fillPassengers" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-passengers)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-passengers)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="passengers"
            stroke="var(--color-passengers)"
            strokeWidth={2}
            fill="url(#fillPassengers)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  ),
}
