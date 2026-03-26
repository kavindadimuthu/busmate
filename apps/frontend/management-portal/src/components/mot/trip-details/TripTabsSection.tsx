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
import type {
  TripResponse,
  RouteResponse,
  ScheduleResponse,
  PassengerServicePermitResponse,
} from '@busmate/api-client-route';

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
    <div className="bg-card shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-border">
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
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`
                    mr-2 h-5 w-5 transition-colors
                    ${isActive ? 'text-primary/80' : 'text-muted-foreground/70 group-hover:text-muted-foreground'}
                  `}
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Actions */}
      <div className="px-6 py-3 bg-muted border-b border-border flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
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