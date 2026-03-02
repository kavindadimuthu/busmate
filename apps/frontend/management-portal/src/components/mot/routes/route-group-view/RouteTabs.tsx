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
import type { RouteResponse } from '../../../../../generated/api-clients/route-management';
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
    <div className="bg-white rounded-xl border-l-3 border-blue-600 shadow-sm overflow-hidden">
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
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
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
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
    <div className="bg-white rounded-xl border-l-3 border-blue-600 shadow-sm p-12">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <RouteIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Route Selected
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Select a route from the tabs above to view its details, stops, map, and schedules.
        </p>
      </div>
    </div>
  );
}
