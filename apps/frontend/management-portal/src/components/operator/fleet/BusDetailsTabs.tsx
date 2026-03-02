'use client';

import React, { useState } from 'react';
import {
  Info, Users, Wrench, MapPin, Route, RefreshCw,
} from 'lucide-react';
import type { OperatorBus } from '@/data/operator/buses';
import { BusSummaryCard }    from './BusSummaryCard';
import { BusSeatingView }    from './BusSeatingView';
import { BusMaintenanceTab } from './BusMaintenanceTab';
import { BusLocationTab }    from './BusLocationTab';
import { BusTripsTab }       from './BusTripsTab';

interface BusDetailsTabsProps {
  bus: OperatorBus;
  onRefresh: () => Promise<void>;
}

type TabId = 'overview' | 'seating' | 'maintenance' | 'location' | 'trips';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export function BusDetailsTabs({ bus, onRefresh }: BusDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  };

  const scheduledMaintenance = bus.maintenanceRecords.filter(
    m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS',
  ).length;

  const tabs: Tab[] = [
    { id: 'overview',     label: 'Overview',     icon: <Info    className="w-4 h-4" /> },
    { id: 'seating',      label: 'Seating',      icon: <Users   className="w-4 h-4" /> },
    { id: 'trips',        label: 'Trips',        icon: <Route   className="w-4 h-4" />, count: bus.recentTrips.length },
    { id: 'maintenance',  label: 'Maintenance',  icon: <Wrench  className="w-4 h-4" />, count: scheduledMaintenance || undefined },
    { id: 'location',     label: 'Location',     icon: <MapPin  className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':    return <BusSummaryCard    bus={bus} />;
      case 'seating':     return <BusSeatingView    bus={bus} />;
      case 'trips':       return <BusTripsTab       bus={bus} />;
      case 'maintenance': return <BusMaintenanceTab bus={bus} />;
      case 'location':    return <BusLocationTab    bus={bus} />;
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-6">
        <nav className="flex -mb-px gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
