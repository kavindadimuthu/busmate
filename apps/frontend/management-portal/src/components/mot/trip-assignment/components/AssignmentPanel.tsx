'use client';

import { useState } from 'react';
import { Settings, Users, CheckSquare, Square, Send, AlertCircle, CheckCircle } from 'lucide-react';
import type { WorkspaceState } from '../TripAssignmentWorkspace';
import type { BulkPspAssignmentRequest } from '../../../../../generated/api-clients/route-management/models/BulkPspAssignmentRequest';
import type { PspTripAssignment } from '../../../../../generated/api-clients/route-management/models/PspTripAssignment';

interface AssignmentPanelProps {
  workspace: WorkspaceState;
  onBulkAssign: (assignments: BulkPspAssignmentRequest) => Promise<any>;
}

export function AssignmentPanel({
  workspace,
  onBulkAssign,
}: AssignmentPanelProps) {
  const [selectedPsps, setSelectedPsps] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');

  const handlePspSelect = (pspId: string) => {
    setSelectedPsps(prev => 
      prev.includes(pspId)
        ? prev.filter(id => id !== pspId)
        : [...prev, pspId]
    );
  };

  const handleBulkAssignment = async () => {
    if (workspace.selectedTrips.length === 0 || selectedPsps.length === 0) {
      return;
    }

    try {
      const assignments: PspTripAssignment[] = [];
      
      if (assignmentMode === 'auto') {
        // Auto-assign PSPs to trips (distribute evenly)
        workspace.selectedTrips.forEach((tripId, index) => {
          const pspIndex = index % selectedPsps.length;
          assignments.push({
            tripId,
            passengerServicePermitId: selectedPsps[pspIndex],
            notes: assignmentNotes || undefined,
          });
        });
      } else {
        // Manual assignment - assign all selected PSPs to all selected trips
        workspace.selectedTrips.forEach(tripId => {
          selectedPsps.forEach(pspId => {
            assignments.push({
              tripId,
              passengerServicePermitId: pspId,
              notes: assignmentNotes || undefined,
            });
          });
        });
      }

      await onBulkAssign({ assignments });
      
      // Reset selections after successful assignment
      setSelectedPsps([]);
      setAssignmentNotes('');
    } catch (error) {
      console.error('Failed to assign PSPs:', error);
    }
  };

  const getAvailablePsps = () => {
    return workspace.permits.filter(psp => {
      // Filter PSPs that have available capacity
      return (psp.maximumBusAssigned || 0) > 0;
    });
  };

  const getAssignedTripsCount = (pspId: string) => {
    return workspace.trips.filter(trip => trip.passengerServicePermitId === pspId).length;
  };

  const getPspUtilization = (psp: any) => {
    const assigned = getAssignedTripsCount(psp.id);
    const maximum = psp.maximumBusAssigned || 0;
    return maximum > 0 ? (assigned / maximum) * 100 : 0;
  };

  if (!workspace.selectedRoute) {
    return (
      <div className="w-1/3 bg-white border-r border-gray-200 p-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Route</h3>
          <p className="text-gray-500">
            Choose a route from the sidebar to start managing assignments
          </p>
        </div>
      </div>
    );
  }

  const availablePsps = getAvailablePsps();

  return (
    <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Settings className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">PSP Assignment</h2>
            <p className="text-sm text-gray-600">Assign permits to selected trips</p>
          </div>
        </div>
      </div>

      {/* Assignment Status */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{workspace.selectedTrips.length}</div>
            <div className="text-sm text-gray-600">Selected Trips</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{selectedPsps.length}</div>
            <div className="text-sm text-gray-600">Selected PSPs</div>
          </div>
        </div>
      </div>

      {/* Assignment Mode */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-3">Assignment Mode</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="assignmentMode"
              value="auto"
              checked={assignmentMode === 'auto'}
              onChange={(e) => setAssignmentMode(e.target.value as 'auto' | 'manual')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-900">Auto Distribution</span>
          </label>
          <p className="ml-6 text-xs text-gray-600">
            Distribute selected PSPs evenly across selected trips
          </p>
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="assignmentMode"
              value="manual"
              checked={assignmentMode === 'manual'}
              onChange={(e) => setAssignmentMode(e.target.value as 'auto' | 'manual')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-900">Manual Assignment</span>
          </label>
          <p className="ml-6 text-xs text-gray-600">
            Assign all selected PSPs to all selected trips
          </p>
        </div>
      </div>

      {/* Available PSPs */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Available PSPs</h3>
          
          {workspace.isLoadingPermits ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading permits...</div>
            </div>
          ) : workspace.permitsError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-sm text-red-600">{workspace.permitsError}</div>
            </div>
          ) : availablePsps.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No available PSPs for this route group</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availablePsps.map((psp) => {
                const utilization = getPspUtilization(psp);
                const isSelected = selectedPsps.includes(psp.id || '');
                
                return (
                  <div
                    key={psp.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => psp.id && handlePspSelect(psp.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{psp.permitNumber}</h4>
                          <p className="text-sm text-gray-600">{psp.operatorName}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        psp.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {psp.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Capacity</span>
                        <span className="font-medium">
                          {getAssignedTripsCount(psp.id || '')} / {psp.maximumBusAssigned}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            utilization >= 90 ? 'bg-red-500' :
                            utilization >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Action */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="space-y-4">
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add notes for this assignment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Error Display */}
          {workspace.assignmentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{workspace.assignmentError}</span>
              </div>
            </div>
          )}

          {/* Assign Button */}
          <button
            onClick={handleBulkAssignment}
            disabled={
              workspace.selectedTrips.length === 0 || 
              selectedPsps.length === 0 || 
              workspace.isAssigningPsps
            }
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {workspace.isAssigningPsps ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>
                  Assign {selectedPsps.length} PSP{selectedPsps.length !== 1 ? 's' : ''} to{' '}
                  {workspace.selectedTrips.length} Trip{workspace.selectedTrips.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}