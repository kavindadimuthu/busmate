'use client';

import { Navigation, Plus, X, Wand2, GripVertical, Edit3, Check, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { RouteGroupFormData, RouteFormData, RouteStop } from './RouteForm';
import type { StopResponse } from '../../../../../generated/api-clients/route-management';

interface RouteTabsContainerProps {
  formData: RouteGroupFormData;
  activeTab: 'outbound' | 'inbound';
  validationErrors: Record<string, string>;
  availableStops: StopResponse[];
  isStopSearchOpen: boolean;
  stopSearchTerm: string;
  stopSearchField: 'start' | 'end' | 'intermediate' | null;
  onActiveTabChange: (tab: 'outbound' | 'inbound') => void;
  onRouteChange: (route: 'outboundRoute' | 'inboundRoute', field: keyof RouteFormData, value: any) => void;
  onStopSearchOpen: (field: 'start' | 'end' | 'intermediate') => void;
  onStopSearchClose: () => void;
  onStopSearchTermChange: (term: string) => void;
  onStopSelect: (stop: StopResponse) => void;
  onRemoveIntermediateStop: (stopIndex: number) => void;
  onAutoGenerateInbound: () => void;
}

export function RouteTabsContainer({
  formData,
  activeTab,
  validationErrors,
  availableStops,
  isStopSearchOpen,
  stopSearchTerm,
  stopSearchField,
  onActiveTabChange,
  onRouteChange,
  onStopSearchOpen,
  onStopSearchClose,
  onStopSearchTermChange,
  onStopSelect,
  onRemoveIntermediateStop,
  onAutoGenerateInbound
}: RouteTabsContainerProps) {

  // State for editing intermediate stops
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [editingDistance, setEditingDistance] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getCurrentRoute = () => {
    return activeTab === 'outbound' ? formData.outboundRoute : formData.inboundRoute;
  };

  const getCurrentRouteKey = () => {
    return activeTab === 'outbound' ? 'outboundRoute' : 'inboundRoute';
  };

  const currentRoute = getCurrentRoute();
  const currentRouteKey = getCurrentRouteKey();

  // Handle distance editing
  const startEditingDistance = (index: number, currentDistance: number) => {
    setEditingStopIndex(index);
    setEditingDistance(currentDistance.toString());
  };

  const saveDistanceEdit = () => {
    if (editingStopIndex === null) return;
    
    const updatedStops = [...currentRoute.routeStops];
    updatedStops[editingStopIndex] = {
      ...updatedStops[editingStopIndex],
      distanceFromStartKm: parseFloat(editingDistance) || 0
    };
    
    onRouteChange(currentRouteKey, 'routeStops', updatedStops);
    setEditingStopIndex(null);
    setEditingDistance('');
  };

  const cancelDistanceEdit = () => {
    setEditingStopIndex(null);
    setEditingDistance('');
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedStops = [...currentRoute.routeStops];
    const draggedStop = updatedStops[draggedIndex];
    
    // Remove dragged item
    updatedStops.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedStops.splice(insertIndex, 0, draggedStop);
    
    // Reorder stop numbers
    const reorderedStops = updatedStops.map((stop, index) => ({
      ...stop,
      stopOrder: index + 1
    }));
    
    onRouteChange(currentRouteKey, 'routeStops', reorderedStops);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 p-1">
          <button
            onClick={() => onActiveTabChange('outbound')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'outbound'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Navigation className="w-4 h-4 rotate-45" />
            Outbound Route
          </button>
          <button
            onClick={() => onActiveTabChange('inbound')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'inbound'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Navigation className="w-4 h-4 rotate-225" />
            Inbound Route
          </button>
          
          {/* Auto-generate button for inbound */}
          {activeTab === 'inbound' && (
            <button
              onClick={onAutoGenerateInbound}
              className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors ml-auto"
            >
              <Wand2 className="w-4 h-4" />
              Auto-generate from Outbound
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 space-y-6">
        {/* Row 1: Route Name and Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentRoute.name}
              onChange={(e) => onRouteChange(currentRouteKey, 'name', e.target.value)}
              placeholder={`${formData.name}-${activeTab === 'outbound' ? 'Outbound' : 'Inbound'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Description
            </label>
            <textarea
              value={currentRoute.description}
              onChange={(e) => onRouteChange(currentRouteKey, 'description', e.target.value)}
              placeholder="Brief description of this route..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Route Number, Road Type, Route Through */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Number
            </label>
            <input
              type="text"
              value={currentRoute.routeNumber || ''}
              onChange={(e) => onRouteChange(currentRouteKey, 'routeNumber', e.target.value)}
              placeholder="e.g., 101, A1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Road Type
            </label>
            <select
              value={currentRoute.roadType || ''}
              onChange={(e) => onRouteChange(currentRouteKey, 'roadType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NORMALWAY">Normalway</option>
              <option value="EXPRESSWAY">Highway</option>
            </select>
          </div>
        </div>

        {/* Row 3: Multilingual Route Through */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Through
            </label>
            <input
              type="text"
              value={currentRoute.routeThrough || ''}
              onChange={(e) => onRouteChange(currentRouteKey, 'routeThrough', e.target.value)}
              placeholder="e.g., via Peradeniya"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Through (Sinhala)
            </label>
            <input
              type="text"
              value={currentRoute.routeThroughSinhala || ''}
              onChange={(e) => onRouteChange(currentRouteKey, 'routeThroughSinhala', e.target.value)}
              placeholder="යන මාර්ගය..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Through (Tamil)
            </label>
            <input
              type="text"
              value={currentRoute.routeThroughTamil || ''}
              onChange={(e) => onRouteChange(currentRouteKey, 'routeThroughTamil', e.target.value)}
              placeholder="கொழும்பு வழியாக செல்லும் பாதை..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 4: Distance and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Distance (km)
            </label>
            <input
              type="number"
              value={currentRoute.distanceKm}
              onChange={(e) => onRouteChange(currentRouteKey, 'distanceKm', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              value={currentRoute.estimatedDurationMinutes}
              onChange={(e) => onRouteChange(currentRouteKey, 'estimatedDurationMinutes', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 3: Start and End Stops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Stop <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => onStopSearchOpen('start')}
              className={`w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors[`${activeTab}Start`] ? 'border-red-300' : 'border-gray-300'
              } ${currentRoute.startStopName ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {currentRoute.startStopName || 'Select start stop...'}
            </button>
            {validationErrors[`${activeTab}Start`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`${activeTab}Start`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Stop <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => onStopSearchOpen('end')}
              className={`w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors[`${activeTab}End`] ? 'border-red-300' : 'border-gray-300'
              } ${currentRoute.endStopName ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {currentRoute.endStopName || 'Select end stop...'}
            </button>
            {validationErrors[`${activeTab}End`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`${activeTab}End`]}</p>
            )}
          </div>
        </div>

        {/* Intermediate Stops Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Intermediate Stops</h4>
              <p className="text-sm text-gray-600">Add stops between start and end locations. Drag to reorder.</p>
            </div>
            <button
              onClick={() => onStopSearchOpen('intermediate')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Stop
            </button>
          </div>
          
          {currentRoute.routeStops.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
              <div className="mb-2">No intermediate stops added yet</div>
              <div className="text-xs text-gray-400">
                Click "Add Stop" to add stops between start and end locations
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentRoute.routeStops.map((stop, index) => (
                <div
                  key={`${stop.stopId}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all cursor-move ${
                    draggedIndex === index
                      ? 'border-blue-400 bg-blue-50 opacity-50'
                      : dragOverIndex === index
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Stop Order Badge */}
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Stop Information */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{stop.stopName}</div>
                    <div className="text-sm text-gray-600">Stop #{stop.stopOrder}</div>
                  </div>

                  {/* Distance Field */}
                  <div className="flex items-center gap-2">
                    {editingStopIndex === index ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingDistance}
                          onChange={(e) => setEditingDistance(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveDistanceEdit();
                            if (e.key === 'Escape') cancelDistanceEdit();
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.0"
                          step="0.1"
                          min="0"
                          autoFocus
                        />
                        <button
                          onClick={saveDistanceEdit}
                          className="text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelDistanceEdit}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 min-w-0">
                          {stop.distanceFromStartKm} km
                        </span>
                        <button
                          onClick={() => startEditingDistance(index, stop.distanceFromStartKm)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit distance"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveIntermediateStop(index)}
                    className="text-red-600 hover:text-red-800 shrink-0"
                    title="Remove stop"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Validation Error */}
          {validationErrors[`${activeTab}Stops`] && (
            <p className="text-sm text-red-600">{validationErrors[`${activeTab}Stops`]}</p>
          )}

          {/* Route Summary */}
          {currentRoute.routeStops.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Route Summary</div>
              <div className="text-sm text-blue-800">
                <div className="flex items-center justify-between">
                  <span>Total Intermediate Stops:</span>
                  <span className="font-medium">{currentRoute.routeStops.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Route Distance:</span>
                  <span className="font-medium">{currentRoute.distanceKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated Duration:</span>
                  <span className="font-medium">
                    {Math.floor(currentRoute.estimatedDurationMinutes / 60)}h {currentRoute.estimatedDurationMinutes % 60}m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stop Search Modal */}
      {isStopSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Select {stopSearchField === 'start' ? 'Start' : stopSearchField === 'end' ? 'End' : 'Intermediate'} Stop
                </h3>
                <button onClick={onStopSearchClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={stopSearchTerm}
                onChange={(e) => onStopSearchTermChange(e.target.value)}
                placeholder="Search stops by name, city, or state..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableStops.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No stops found matching your search
                  </div>
                ) : (
                  availableStops.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => onStopSelect(stop)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{stop.name}</div>
                      <div className="text-sm text-gray-600">
                        {stop.location?.city}, {stop.location?.state}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}