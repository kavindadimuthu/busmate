'use client';

import { useState } from 'react';
import { 
  Bus, 
  FileText, 
  Route as RouteIcon, 
  MoreHorizontal, 
  Plus,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Settings,
  Calendar,
  MapPin,
  Users,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import type { OperatorResponse, BusResponse } from '../../../../generated/api-clients/route-management';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface OperatorTabsSectionProps {
  operator: OperatorResponse;
  buses: BusResponse[];
  busesLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function OperatorTabsSection({ 
  operator, 
  buses, 
  busesLoading,
  onRefresh 
}: OperatorTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('buses');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs: TabType[] = [
    { 
      id: 'buses', 
      label: 'Fleet Management', 
      icon: <Bus className="w-4 h-4" />, 
      count: buses.length 
    },
    { 
      id: 'permits', 
      label: 'Service Permits', 
      icon: <FileText className="w-4 h-4" />,
      count: 0 // TODO: Get from API
    },
    { 
      id: 'trips', 
      label: 'Trips & Schedules', 
      icon: <RouteIcon className="w-4 h-4" />,
      count: 0 // TODO: Get from API
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <Activity className="w-4 h-4" />
    },
    { 
      id: 'more', 
      label: 'More', 
      icon: <MoreHorizontal className="w-4 h-4" />
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return undefined;
    
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const renderBusesTab = () => (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fleet Management</h3>
          <p className="text-sm text-gray-600">
            Manage all buses owned by {operator.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || busesLoading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href={`/mot/buses/add-new?operatorId=${operator.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New Bus
          </Link>
        </div>
      </div>

      {/* Buses List */}
      {busesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading buses...</span>
        </div>
      ) : buses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buses Found</h3>
          <p className="text-gray-600 mb-6">
            This operator doesn't have any buses registered yet.
          </p>
          <Link
            href={`/mot/buses/add-new?operatorId=${operator.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Register First Bus
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bus Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Capacity & Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {bus.plateNumber || 'Unknown Plate'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {bus.id?.slice(-8) || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {bus.ntcRegistrationNumber || 'Not registered'}
                        </div>
                        <div className="text-sm text-gray-500">
                          NTC Registration
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {bus.capacity || 0} seats
                        </div>
                        <div className="text-sm text-gray-500">
                          {bus.model || 'Model not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(bus.status)}>
                        {bus.status?.charAt(0).toUpperCase() + (bus.status?.slice(1) || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mot/buses/${bus.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/mot/buses/${bus.id}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlaceholderTab = (
    title: string, 
    description: string, 
    icon: React.ReactNode,
    features: string[]
  ) => (
    <div className="space-y-4">
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 text-gray-300 mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
          {features.map((feature, index) => (
            <p key={index}>• {feature}</p>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'buses' && renderBusesTab()}
        
        {activeTab === 'permits' && renderPlaceholderTab(
          'Service Permits Management',
          '🔌 API Integration Point: Implement service permits functionality',
          <FileText className="w-16 h-16" />,
          [
            'View all passenger service permits',
            'Track permit validity and renewals',
            'Manage permit assignments to buses',
            'Handle permit applications and approvals'
          ]
        )}

        {activeTab === 'trips' && renderPlaceholderTab(
          'Trips & Schedules',
          '🔌 API Integration Point: Implement trips and schedules management',
          <RouteIcon className="w-16 h-16" />,
          [
            'View all assigned trips and schedules',
            'Track trip completion and performance',
            'Manage driver assignments',
            'Monitor route adherence and delays'
          ]
        )}

        {activeTab === 'analytics' && renderPlaceholderTab(
          'Analytics & Reports',
          '🔌 API Integration Point: Implement analytics dashboard',
          <Activity className="w-16 h-16" />,
          [
            'Fleet utilization statistics',
            'Revenue and performance metrics',
            'Route efficiency analysis',
            'Maintenance and operational costs'
          ]
        )}

        {activeTab === 'more' && renderPlaceholderTab(
          'Additional Features',
          '🔌 API Integration Point: Add more operator-related features',
          <Settings className="w-16 h-16" />,
          [
            'Compliance and regulatory information',
            'Insurance and legal documentation',
            'Maintenance schedules and history',
            'Driver management and assignments'
          ]
        )}
      </div>
    </div>
  );
}