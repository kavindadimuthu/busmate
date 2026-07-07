'use client';

import { useState } from 'react';
import { Route as RouteIcon, Bus, MapPin, ArrowRight } from 'lucide-react';
import type { OperatorPermitDetail, RouteInfo } from '@/data/operator/permits';

interface PermitInfoPanelProps {
  permit: OperatorPermitDetail;
}

type TabId = 'routes' | 'details';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export function PermitInfoPanel({ permit }: PermitInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('routes');

  const tabs: Tab[] = [
    {
      id: 'routes',
      label: 'Route Information',
      icon: <RouteIcon className="w-4 h-4" />,
      count: permit.routes.length,
    },
    {
      id: 'details',
      label: 'Permit Details',
      icon: <Bus className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Tab header */}
      <div className="border-b border-border px-1">
        <nav className="flex overflow-x-auto" aria-label="Permit info tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'routes' && <RoutesTab routes={permit.routes} routeGroupName={permit.routeGroupName} routeGroupCode={permit.routeGroupCode} />}
        {activeTab === 'details' && <DetailsTab permit={permit} />}
      </div>
    </div>
  );
}

// ── Routes Tab ──────────────────────────────────────────────────────────────

interface RoutesTabProps {
  routes: RouteInfo[];
  routeGroupName: string;
  routeGroupCode: string;
}

function RoutesTab({ routes, routeGroupName, routeGroupCode }: RoutesTabProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-8">
        <RouteIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No route information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Route group summary */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <RouteIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">{routeGroupName}</p>
            <p className="text-xs text-primary mt-0.5">Code: {routeGroupCode} &middot; {routes.length} route{routes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Individual routes */}
      <div className="space-y-3">
        {routes.map((route) => (
          <div key={route.id} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">
                    {route.routeNumber}
                  </span>
                  <p className="text-sm font-medium text-foreground">{route.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-success" />
                    {route.origin}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-destructive/80" />
                    {route.destination}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-semibold text-foreground">{route.distance} km</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Details Tab ─────────────────────────────────────────────────────────────

interface DetailsTabProps {
  permit: OperatorPermitDetail;
}

function DetailsTab({ permit }: DetailsTabProps) {
  function fmt(d?: string) {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return 'Invalid'; }
  }

  const rows: Array<{ label: string; value: string | number }> = [
    { label: 'Permit ID', value: permit.id },
    { label: 'Operator', value: permit.operatorName },
    { label: 'Contact Person', value: permit.contactPerson },
    { label: 'Contact Phone', value: permit.contactPhone },
    { label: 'Address', value: permit.address },
    { label: 'Maximum Buses Allowed', value: permit.maximumBusAssigned },
    { label: 'Issued By', value: permit.issuedBy },
    { label: 'Record Created', value: fmt(permit.createdAt) },
    { label: 'Last Updated', value: fmt(permit.updatedAt) },
  ];

  return (
    <dl className="divide-y divide-gray-100">
      {rows.map(({ label, value }) => (
        <div key={label} className="py-3 grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="text-sm text-foreground col-span-2 font-medium break-all">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
