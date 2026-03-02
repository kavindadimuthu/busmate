'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Route, 
  Calendar, 
  Users, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { TripDetailsTab } from './tabs/TripDetailsTab';
import { TripRouteTab } from './tabs/TripRouteTab';
import { TripScheduleTab } from './tabs/TripScheduleTab';
import { TripAssignmentsTab } from './tabs/TripAssignmentsTab';
import { TripStatusTab } from './tabs/TripStatusTab';
import type { TripResponse } from '../../../../generated/api-clients/route-management/models/TripResponse';
import type { RouteResponse } from '../../../../generated/api-clients/route-management/models/RouteResponse';
import type { ScheduleResponse } from '../../../../generated/api-clients/route-management/models/ScheduleResponse';
import type { PassengerServicePermitResponse } from '../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';

interface TripTabsSectionProps {
  trip: TripResponse;
  route?: RouteResponse | null;
  schedule?: ScheduleResponse | null;
  permit?: PassengerServicePermitResponse | null;
  onRefresh?: () => void;
}

type TabType = 'details' | 'route' | 'schedule' | 'assignments' | 'status';

export function TripTabsSection({
  trip,
  route,
  schedule,
  permit,
  onRefresh
}: TripTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  const tabs = [
    {
      id: 'details' as TabType,
      name: 'Trip Details',
      icon: FileText,
      description: 'Complete trip information and timeline'
    },
    {
      id: 'route' as TabType,
      name: 'Route Information',
      icon: Route,
      description: 'Route details, stops, and map view'
    },
    {
      id: 'schedule' as TabType,
      name: 'Schedule Details',
      icon: Calendar,
      description: 'Schedule information and calendar rules'
    },
    {
      id: 'assignments' as TabType,
      name: 'Assignments',
      icon: Users,
      description: 'PSP, bus, driver, and conductor assignments'
    },
    {
      id: 'status' as TabType,
      name: 'Status History',
      icon: Activity,
      description: 'Trip status changes and timeline'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <TripDetailsTab 
            trip={trip}
            route={route}
            schedule={schedule}
            permit={permit}
          />
        );
      case 'route':
        return (
          <TripRouteTab 
            trip={trip}
            route={route}
          />
        );
      case 'schedule':
        return (
          <TripScheduleTab 
            trip={trip}
            schedule={schedule}
            onRefresh={onRefresh}
          />
        );
      case 'assignments':
        return (
          <TripAssignmentsTab 
            trip={trip}
            permit={permit}
            onRefresh={onRefresh}
          />
        );
      case 'status':
        return (
          <TripStatusTab 
            trip={trip}
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
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`
                    mr-2 h-5 w-5 transition-colors
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Actions */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}