'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Bus, 
  AlertTriangle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ScheduleResponse, RouteResponse, TripResponse } from '../../../../generated/api-clients/route-management';
import { 
  ScheduleStopsTab,
  ScheduleCalendarTab,
  ScheduleTripsTab,
  ScheduleExceptionsTab
} from './tabs';

interface ScheduleTabsSectionProps {
  schedule: ScheduleResponse;
  route?: RouteResponse | null;
  trips: TripResponse[];
  tripsLoading?: boolean;
  onRefresh?: () => void;
  onGenerateTrips?: () => void;
  onAssignBuses?: () => void;
}

type TabType = 'stops' | 'calendar' | 'trips' | 'exceptions';

export function ScheduleTabsSection({
  schedule,
  route,
  trips,
  tripsLoading = false,
  onRefresh,
  onGenerateTrips,
  onAssignBuses
}: ScheduleTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stops');

  const tabs = [
    {
      id: 'stops' as TabType,
      name: 'Schedule Stops',
      icon: MapPin,
      count: schedule.scheduleStops?.length || 0
    },
    {
      id: 'calendar' as TabType,
      name: 'Calendar Rules',
      icon: Calendar,
      count: schedule.scheduleCalendars?.length || 0
    },
    {
      id: 'trips' as TabType,
      name: 'Generated Trips',
      icon: Bus,
      count: trips.length
    },
    {
      id: 'exceptions' as TabType,
      name: 'Exceptions',
      icon: AlertTriangle,
      count: schedule.scheduleExceptions?.length || 0
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stops':
        return (
          <ScheduleStopsTab 
            schedule={schedule} 
            route={route}
          />
        );
      case 'calendar':
        return (
          <ScheduleCalendarTab 
            schedule={schedule}
            onRefresh={onRefresh}
          />
        );
      case 'trips':
        return (
          <ScheduleTripsTab 
            schedule={schedule}
            trips={trips}
            isLoading={tripsLoading}
            onRefresh={onRefresh}
            onGenerateTrips={onGenerateTrips}
            onAssignBuses={onAssignBuses}
          />
        );
      case 'exceptions':
        return (
          <ScheduleExceptionsTab 
            schedule={schedule}
            onRefresh={onRefresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}