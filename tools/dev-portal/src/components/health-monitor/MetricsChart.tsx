import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  timestamp: string;
  value: number;
  label: string;
}

interface MetricsChartProps {
  title: string;
  unit?: string;
  color?: string;
  data: DataPoint[];
}

export function MetricsChart({
  title,
  unit = "",
  color = "hsl(var(--primary))",
  data,
}: MetricsChartProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {data.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, title]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook to accumulate time-series data points from periodic polling.
 */
export function useTimeSeriesCollector(maxPoints = 30) {
  const [data, setData] = useState<DataPoint[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;

  const addPoint = (value: number) => {
    const now = new Date();
    const label = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const point: DataPoint = { timestamp: now.toISOString(), value, label };
    setData((prev) => {
      const next = [...prev, point];
      return next.length > maxPoints ? next.slice(-maxPoints) : next;
    });
  };

  const reset = () => setData([]);

  return { data, addPoint, reset };
}
