'use client';

import { useState } from 'react';
import { Calendar, Clock, Plus, Play, RefreshCw, AlertCircle } from 'lucide-react';
import type { WorkspaceState } from '../TripAssignmentWorkspace';
import type { ScheduleResponse } from '../../../../../generated/api-clients/route-management/models/ScheduleResponse';

interface PlanningPanelProps {
  workspace: WorkspaceState;
  onScheduleSelect: (scheduleId: string) => void;
  onGenerateTrips: (scheduleId: string, startDate: Date, endDate: Date) => Promise<any>;
}

export function PlanningPanel({
  workspace,
  onScheduleSelect,
  onGenerateTrips,
}: PlanningPanelProps) {
  const [generateDateRange, setGenerateDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
  });
  const [generateForFullPeriod, setGenerateForFullPeriod] = useState(false);

  const handleGenerateTrips = async () => {
    if (!workspace.selectedSchedule) return;

    try {
      const startDate = generateForFullPeriod ? new Date() : generateDateRange.startDate;
      const endDate = generateForFullPeriod ? new Date() : generateDateRange.endDate;
      
      await onGenerateTrips(workspace.selectedSchedule, startDate, endDate);
    } catch (error) {
      console.error('Failed to generate trips:', error);
    }
  };

  const getScheduleStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!workspace.selectedRoute) {
    return (
      <div className="w-1/3 bg-white border-r border-gray-200 p-6">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Route</h3>
          <p className="text-gray-500">
            Choose a route from the sidebar to start planning trips
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trip Planning</h2>
            <p className="text-sm text-gray-600">Generate trips from schedules</p>
          </div>
        </div>
      </div>

      {/* Schedule Selection */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Available Schedules</h3>
          
          {workspace.isLoadingSchedules ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading schedules...</div>
            </div>
          ) : workspace.schedulesError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-sm text-red-600">{workspace.schedulesError}</div>
            </div>
          ) : workspace.schedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No schedules available for this route</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workspace.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    workspace.selectedSchedule === schedule.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => schedule.id && onScheduleSelect(schedule.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                      {schedule.description && (
                        <p className="text-sm text-gray-600 mt-1">{schedule.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScheduleStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {schedule.effectiveStartDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>From {new Date(schedule.effectiveStartDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {schedule.effectiveEndDate && (
                      <div className="flex items-center space-x-1">
                        <span>To {new Date(schedule.effectiveEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {schedule.scheduleType && (
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.scheduleType === 'REGULAR' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {schedule.scheduleType}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Generation Section */}
        {workspace.selectedSchedule && (
          <div className="p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Generate Trips</h3>
            
            <div className="space-y-4">
              {/* Date Range Option */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="generateOption"
                    checked={!generateForFullPeriod}
                    onChange={() => setGenerateForFullPeriod(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Specific Date Range</span>
                </label>
                
                {!generateForFullPeriod && (
                  <div className="ml-6 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={generateDateRange.startDate.toISOString().split('T')[0]}
                        onChange={(e) => setGenerateDateRange(prev => ({
                          ...prev,
                          startDate: new Date(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={generateDateRange.endDate.toISOString().split('T')[0]}
                        onChange={(e) => setGenerateDateRange(prev => ({
                          ...prev,
                          endDate: new Date(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Full Period Option */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="generateOption"
                    checked={generateForFullPeriod}
                    onChange={() => setGenerateForFullPeriod(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Full Schedule Period</span>
                </label>
                {generateForFullPeriod && (
                  <p className="ml-6 text-xs text-gray-600 mt-1">
                    Generate trips for the entire validity period of the schedule
                  </p>
                )}
              </div>

              {/* Error Display */}
              {workspace.generateTripsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{workspace.generateTripsError}</span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateTrips}
                disabled={workspace.isGeneratingTrips}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {workspace.isGeneratingTrips ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Generate Trips</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}