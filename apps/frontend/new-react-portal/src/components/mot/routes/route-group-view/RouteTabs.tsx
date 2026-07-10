'use client';

import { useState } from 'react';
import {
  Info,
  MapPin,
  Map,
  Calendar,
  BarChart3,
  Route as RouteIcon,
} from 'lucide-react';
import type { RouteResponse } from '@busmate/api-client-route';
import { RouteOverviewTab } from './tabs/RouteOverviewTab';
import { RouteStopsTab } from './tabs/RouteStopsTab';
import { RouteMapTab } from './tabs/RouteMapTab';
import { RouteSchedulesTab } from './tabs/RouteSchedulesTab';
import { RouteAnalyticsTab } from './tabs/RouteAnalyticsTab';

// ── Types ─────────────────────────────────────────────────────────

interface RouteTabsProps {
  route: RouteResponse;
}

type TabId = 'overview' | 'stops' | 'map' | 'schedules' | 'analytics';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Info;
}

// ── Tab definitions ───────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'stops', label: 'Stops', icon: MapPin },
  { id: 'map', label: 'Map View', icon: Map },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// ── Component ─────────────────────────────────────────────────────

export function RouteTabs({ route }: RouteTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="bg-card rounded-xl border-l-3 border-primary shadow-sm overflow-hidden">
      {/* Tab navigation */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary bg-primary/10/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:bg-muted'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-primary/80' : 'text-muted-foreground/70'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'overview' && <RouteOverviewTab route={route} />}
        {activeTab === 'stops' && <RouteStopsTab route={route} />}
        {activeTab === 'map' && <RouteMapTab route={route} />}
        {activeTab === 'schedules' && <RouteSchedulesTab route={route} />}
        {activeTab === 'analytics' && <RouteAnalyticsTab route={route} />}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────

export function RouteTabsEmpty() {
  return (
    <div className="bg-card rounded-xl border-l-3 border-primary shadow-sm p-12">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <RouteIcon className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Route Selected
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Select a route from the tabs above to view its details, stops, map, and schedules.
        </p>
      </div>
    </div>
  );
}
