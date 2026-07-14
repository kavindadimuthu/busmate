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
import { ScheduleResponse, RouteResponse, TripResponse } from '@busmate/api-client-route';
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
    <div className="bg-card shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-border">
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
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
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