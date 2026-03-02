'use client';

import { useState } from 'react';
import { Navigation, Calendar, Bus, Activity, Map } from 'lucide-react';
import type { OperatorTrip, OperatorTripBus, OperatorTripRoute, OperatorTripSchedule, OperatorTripStaff, OperatorTripPermit } from '@/data/operator/trips';
import { TripRouteTab } from './TripRouteTab';
import { TripScheduleTab } from './TripScheduleTab';
import { TripAssignmentsTab } from './TripAssignmentsTab';
import { TripStatusTab } from './TripStatusTab';

interface TripTabsSectionProps {
  trip: OperatorTrip;
  route?: OperatorTripRoute | null;
  schedule?: OperatorTripSchedule | null;
  bus?: OperatorTripBus | null;
  staff?: OperatorTripStaff | null;
  permit?: OperatorTripPermit | null;
}

type TabId = 'route' | 'schedule' | 'assignments' | 'status';

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [
  { id: 'route',       label: 'Route',       icon: Map,       description: 'Route stops and distance information' },
  { id: 'schedule',    label: 'Schedule',    icon: Calendar,   description: 'Operating schedule and timing details' },
  { id: 'assignments', label: 'Assignments', icon: Bus,        description: 'Bus, driver, conductor and permit' },
  { id: 'status',      label: 'Status',      icon: Activity,   description: 'Trip status and timing analysis' },
];

export function TripTabsSection({
  trip,
  route,
  schedule,
  bus,
  staff,
  permit,
}: TripTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('route');

  function renderContent() {
    switch (activeTab) {
      case 'route':
        return <TripRouteTab trip={trip} route={route} />;
      case 'schedule':
        return <TripScheduleTab trip={trip} schedule={schedule} />;
      case 'assignments':
        return <TripAssignmentsTab trip={trip} bus={bus} staff={staff} permit={permit} />;
      case 'status':
        return <TripStatusTab trip={trip} />;
    }
  }

  const activeTabCfg = TABS.find((t) => t.id === activeTab);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tab navigation */}
      <nav className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab description bar */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <Navigation className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs text-gray-500">{activeTabCfg?.description}</p>
      </div>

      {/* Content */}
      <div className="p-6">{renderContent()}</div>
    </div>
  );
}
