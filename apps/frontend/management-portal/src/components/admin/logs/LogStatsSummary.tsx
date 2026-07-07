'use client';

import { Terminal } from 'lucide-react';
import type { getLogStats } from '@/data/admin';

type LogStats = ReturnType<typeof getLogStats>;

interface LogStatsSummaryProps {
  stats: LogStats;
}

export function LogStatsSummary({ stats }: LogStatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Top User Actions
        </h3>
        <div className="space-y-3">
          {stats.topActions.map((item, idx) => {
            const maxCount = stats.topActions[0]?.count || 1;
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground/80">{item.action}</span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Error Rates */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Service Error Rates
        </h3>
        <div className="space-y-3">
          {stats.topServices.map((item, idx) => {
            const errorRate =
              item.totalCount > 0
                ? ((item.errorCount / item.totalCount) * 100).toFixed(1)
                : '0';
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded">
                    <Terminal className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80">{item.service}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{item.totalCount} total</span>
                  <span
                    className={`font-medium ${
                      item.errorCount > 0 ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    {item.errorCount} errors ({errorRate}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
