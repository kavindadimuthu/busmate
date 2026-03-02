'use client';

import { AlertTriangle, Plus, Edit, Trash2, Calendar, Info } from 'lucide-react';
import { ScheduleResponse } from '../../../../../generated/api-clients/route-management';

interface ScheduleExceptionsTabProps {
  schedule: ScheduleResponse;
  onRefresh?: () => void;
}

export function ScheduleExceptionsTab({ schedule, onRefresh }: ScheduleExceptionsTabProps) {
  const exceptions = schedule.scheduleExceptions || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getExceptionTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Delayed
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Modified
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {type || 'Other'}
          </span>
        );
    }
  };

  if (exceptions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Exceptions</h3>
        <p className="text-gray-500 mb-6">
          This schedule doesn't have any exceptions or alerts configured yet.
        </p>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Exception
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Schedule Exceptions</h3>
          <p className="mt-1 text-sm text-gray-500">
            {exceptions.length} exceptions configured for this schedule
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Exception
        </button>
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {exceptions.map((exception, index) => (
          <div key={exception.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900">
                    Exception #{index + 1}
                  </h4>
                  {getExceptionTypeBadge(exception.exceptionType)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Exception Date
                    </dt>
                    <dd className="text-gray-900">{formatDate(exception.exceptionDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Type</dt>
                    <dd className="text-gray-900">{exception.exceptionType || 'Not specified'}</dd>
                  </div>
                </div>

                {/* Exception ID */}
                {exception.id && (
                  <div className="mt-3 text-xs text-gray-500">
                    Exception ID: {exception.id}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Schedule Exception Summary</p>
            <p className="text-yellow-700">
              This schedule has {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''} that may affect normal operations.
              {exceptions.length > 0 && ' Review each exception to understand the impact on trips and passengers.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}