'use client';

import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ServiceSummary } from '@/data/admin/dashboard-v2';

function StatusBadge({ status }: { status: ServiceSummary['status'] }) {
  const config = {
    healthy:  { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" />,  label: 'Healthy' },
    degraded: { cls: 'bg-amber-100 text-amber-700',  icon: <AlertTriangle className="h-3 w-3" />, label: 'Degraded' },
    down:     { cls: 'bg-red-100 text-red-700',      icon: <XCircle className="h-3 w-3" />,       label: 'Down' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

interface DashboardServiceStatusProps {
  services: ServiceSummary[];
  loading?: boolean;
}

export function DashboardServiceStatus({ services, loading = false }: DashboardServiceStatusProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-36 mb-4" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-muted rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Service Status</h3>
        <Link
          href="/admin/monitoring/api"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Details <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Service</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden sm:table-cell">Resp</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">Err%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-muted transition-colors">
                <td className="px-3 py-2 font-medium text-foreground truncate max-w-[120px]">{svc.name}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={svc.status} />
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">
                  {svc.responseTime > 0 ? `${svc.responseTime}ms` : '—'}
                </td>
                <td className={`px-3 py-2 text-right hidden md:table-cell font-medium ${
                  svc.errorRate >= 5 ? 'text-red-600' : svc.errorRate >= 1 ? 'text-amber-600' : 'text-muted-foreground'
                }`}>
                  {svc.status === 'down' ? '—' : `${svc.errorRate.toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
