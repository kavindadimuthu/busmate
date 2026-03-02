'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ArrowLeft, Route, MapPin } from 'lucide-react';
import type { RouteGroupResponse, RouteResponse } from '../../../../generated/api-clients/route-management';

interface DeleteRouteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  routeGroup?: RouteGroupResponse | null;
  route?: RouteResponse | null;
  isDeleting?: boolean;
}

export default function DeleteRouteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  routeGroup,
  route,
  isDeleting = false,
}: DeleteRouteConfirmationProps) {
  const [confirmText, setConfirmText] = useState('');
  const [showModal, setShowModal] = useState(false);

  const requiredText = 'DELETE';
  const isConfirmValid = confirmText === requiredText;

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Reset form when closing
      setConfirmText('');
      document.body.style.overflow = 'unset';
      
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setShowModal(false), 300);
      return () => clearTimeout(timer);
    }

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onClose]);

  const handleConfirm = async () => {
    if (!isConfirmValid || isDeleting) return;
    await onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  if (!showModal) return null;

  const routeCount = routeGroup?.routes?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
        <div
          className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {route ? 'Delete Route' : 'Delete Route Group'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="rounded-md text-gray-800 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        This action cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {route 
                          ? 'This will permanently delete the route from the system.'
                          : 'This will permanently delete the route group and all its associated routes from the system.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Group Details */}
                {routeGroup && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Route Group to be deleted:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-sm text-gray-900">{routeGroup.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">ID:</span>
                        <span className="ml-2 text-sm font-mono text-gray-600">{routeGroup.id}</span>
                      </div>
                      {routeGroup.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Description:</span>
                          <span className="ml-2 text-sm text-gray-900">{routeGroup.description}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Routes:</span>
                        <div className="flex items-center ml-2">
                          <Route className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900 font-medium">
                            {routeCount} {routeCount === 1 ? 'route' : 'routes'}
                          </span>
                        </div>
                      </div>
                      {routeGroup.createdAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Created:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(routeGroup.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Route Details */}
                {route && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Route to be deleted:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-sm text-gray-900">{route.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">ID:</span>
                        <span className="ml-2 text-sm font-mono text-gray-600">{route.id}</span>
                      </div>
                      {route.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Description:</span>
                          <span className="ml-2 text-sm text-gray-900">{route.description}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Route Group:</span>
                        <span className="ml-2 text-sm text-gray-900">{route.routeGroupName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Direction:</span>
                        <span className="ml-2 text-sm text-gray-900">{route.direction || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Route:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {route.startStopName || 'Unknown'} → {route.endStopName || 'Unknown'}
                        </span>
                      </div>
                      {route.distanceKm && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Distance:</span>
                          <span className="ml-2 text-sm text-gray-900">{route.distanceKm.toFixed(1)} km</span>
                        </div>
                      )}
                      {route.createdAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Created:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(route.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Impact Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">
                    Potential Impact
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {routeGroup ? (
                      <>
                        <li>• All {routeCount} route{routeCount !== 1 ? 's' : ''} in this group will be permanently deleted</li>
                        <li>• Bus schedules associated with these routes will be affected</li>
                        <li>• Passenger service permits linked to these routes may become invalid</li>
                        <li>• Historical trip data and analytics will be permanently lost</li>
                        <li>• Any ongoing services using these routes will be disrupted</li>
                      </>
                    ) : (
                      <>
                        <li>• This route will be permanently deleted from the system</li>
                        <li>• Bus schedules associated with this route will be affected</li>
                        <li>• Passenger service permits linked to this route may become invalid</li>
                        <li>• Historical trip data and analytics for this route will be permanently lost</li>
                        <li>• Any ongoing services using this route will be disrupted</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Routes List if any */}
                {routeGroup?.routes && routeGroup.routes.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-3">
                      Routes that will be deleted:
                    </h4>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="space-y-2">
                        {routeGroup.routes.slice(0, 5).map((route, index) => (
                          <li key={route.id || index} className="flex items-center text-sm text-orange-700">
                            <MapPin className="h-3 w-3 mr-2 shrink-0" />
                            <span className="truncate">
                              {route.name || `Route ${index + 1}`}
                              {route.direction && ` (${route.direction})`}
                            </span>
                          </li>
                        ))}
                        {routeGroup.routes.length > 5 && (
                          <li className="text-sm text-orange-600 italic">
                            ... and {routeGroup.routes.length - 5} more routes
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Confirmation Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono bg-gray-100 px-1 rounded">{requiredText}</span> to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Type "${requiredText}" to confirm`}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:opacity-50"
                    autoComplete="off"
                  />
                  {confirmText && !isConfirmValid && (
                    <p className="mt-1 text-sm text-red-600">
                      Please type exactly "{requiredText}" to confirm
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isConfirmValid || isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting Route Group...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Route Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}