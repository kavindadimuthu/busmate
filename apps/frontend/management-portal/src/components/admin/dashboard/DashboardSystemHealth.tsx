'use client';

import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ServiceSummary } from '@/data/admin/dashboardV2';

// ── Health Score Ring ─────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">Health</span>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────

function ResourceBar({ label, value, unit = '%' }: { label: string; value: number; unit?: string }) {
  const color = value >= 85 ? 'bg-destructive' : value >= 70 ? 'bg-warning' : 'bg-primary/80';
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Service status icon ───────────────────────────────────────────

function StatusIcon({ status }: { status: ServiceSummary['status'] }) {
  if (status === 'healthy')  return <CheckCircle2 className="h-3.5 w-3.5 text-success/80 shrink-0" />;
  if (status === 'degraded') return <AlertTriangle className="h-3.5 w-3.5 text-warning/80 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-destructive/80 shrink-0" />;
}

// ── Main component ────────────────────────────────────────────────

interface DashboardSystemHealthProps {
  services: ServiceSummary[];
  loading?: boolean;
}

export function DashboardSystemHealth({ services, loading = false }: DashboardSystemHealthProps) {
  // Derive health score from services
  const totalSvc = services.length || 1;
  const healthySvc = services.filter((s) => s.status === 'healthy').length;
  const degradedSvc = services.filter((s) => s.status === 'degraded').length;
  const downSvc = services.filter((s) => s.status === 'down').length;
  const healthScore = Math.round((healthySvc / totalSvc) * 100 - downSvc * 5 - degradedSvc * 2);

  // Derive avg resource usage (mock values here, replace with real KPIs from backend)
  const cpuUsage = 42.4;
  const memUsage = 64.8;
  const diskUsage = 45.2;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse space-y-4">
        <div className="h-5 bg-muted rounded w-32" />
        <div className="w-28 h-28 bg-muted rounded-full mx-auto" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-4 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  const overallStatus = downSvc > 0 ? 'degraded' : degradedSvc > 0 ? 'degraded' : 'healthy';

  return (
    <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">System Health</h3>
        <Link
          href="/admin/monitoring"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
        >
          Details <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Health ring */}
      <HealthRing score={Math.max(0, healthScore)} />

      {/* Status badges */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-success/10 rounded-lg p-2">
          <p className="text-lg font-bold text-success">{healthySvc}</p>
          <p className="text-[10px] text-success">Healthy</p>
        </div>
        <div className="bg-warning/10 rounded-lg p-2">
          <p className="text-lg font-bold text-warning">{degradedSvc}</p>
          <p className="text-[10px] text-warning">Degraded</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-2">
          <p className="text-lg font-bold text-destructive">{downSvc}</p>
          <p className="text-[10px] text-destructive">Down</p>
        </div>
      </div>

      {/* Resource bars */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</p>
        <ResourceBar label="CPU" value={cpuUsage} />
        <ResourceBar label="Memory" value={memUsage} />
        <ResourceBar label="Disk" value={diskUsage} />
      </div>

      {/* Service list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Services</p>
        {services.slice(0, 5).map((svc) => (
          <div key={svc.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <StatusIcon status={svc.status} />
              <span className="text-xs text-foreground truncate">{svc.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{svc.responseTime > 0 ? `${svc.responseTime}ms` : '—'}</span>
          </div>
        ))}
        {services.length > 5 && (
          <Link href="/admin/monitoring/api" className="text-xs text-primary hover:underline">
            +{services.length - 5} more services
          </Link>
        )}
      </div>
    </div>
  );
}
