'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  ArrowLeft, 
  Trash2, 
  FileText, 
  Building2, 
  Calendar, 
  Bus, 
  MapPin,
  User,
  Settings,
  Route as RouteIcon
} from 'lucide-react';
import type { 
  PassengerServicePermitResponse, 
  OperatorResponse, 
  RouteGroupResponse,
  BusResponse 
} from '../../../../generated/api-clients/route-management';

interface DeletePermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  permit: PassengerServicePermitResponse | null;
  operator?: OperatorResponse | null;
  routeGroup?: RouteGroupResponse | null;
  assignedBuses?: BusResponse[];
  isDeleting?: boolean;
}

export function DeletePermitModal({
  isOpen,
  onClose,
  onConfirm,
  permit,
  operator,
  routeGroup,
  assignedBuses = [],
  isDeleting = false,
}: DeletePermitModalProps) {
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

  // Get status color and label
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'pending':
        return { label: 'Pending', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'expired':
        return { label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200' };
      case 'suspended':
        return { label: 'Suspended', color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-gray-600 bg-gray-50 border-gray-200' };
      default:
        return { label: status || 'Unknown', color: 'text-gray-600 bg-gray-50 border-gray-200' };
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

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const statusInfo = getStatusInfo(permit?.status);
  const activeBusesCount = assignedBuses.filter(bus => bus.status === 'active').length;

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
                      Delete Passenger Service Permit
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
                {/* Critical Warning Message */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        ⚠️ Critical Action - Cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently delete the passenger service permit and remove all associated operational data from the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permit Details */}
                {permit && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Permit to be deleted:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Permit Number:</span>
                        <span className="ml-2 text-sm text-gray-900 font-medium">
                          {permit.permitNumber || 'Not assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Permit ID:</span>
                        <span className="ml-2 text-sm font-mono text-gray-600">{permit.id}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Permit Type:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {permit.permitType || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Operator:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {permit.operatorName || operator?.name || 'Not assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Route Group:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {permit.routeGroupName || routeGroup?.name || 'Not assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maximum Buses:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {permit.maximumBusAssigned || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Validity Period:</span>
                        <div className="ml-2 text-sm text-gray-900">
                          {formatDate(permit.issueDate)} → {formatDate(permit.expiryDate)}
                          {isExpired(permit.expiryDate) && (
                            <span className="ml-2 text-red-600 font-medium">(EXPIRED)</span>
                          )}
                        </div>
                      </div>
                      {permit.createdAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Created:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {formatDate(permit.createdAt)}
                            {permit.createdBy && (
                              <span className="text-gray-500"> by {permit.createdBy}</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Operator Information */}
                {operator && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Associated Operator
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <strong>Name:</strong> {operator.name}
                      </div>
                      <div>
                        <strong>Type:</strong> {operator.operatorType || 'Not specified'}
                      </div>
                      <div>
                        <strong>Region:</strong> {operator.region || 'Not specified'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Group Information */}
                {routeGroup && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                      <RouteIcon className="w-4 h-4 mr-2" />
                      Associated Route Group
                    </h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <div>
                        <strong>Name:</strong> {routeGroup.name}
                      </div>
                      {routeGroup.description && (
                        <div>
                          <strong>Description:</strong> {routeGroup.description}
                        </div>
                      )}
                      <div>
                        <strong>Routes:</strong> {routeGroup.routes?.length || 0} routes
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Buses Warning */}
                {assignedBuses.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
                      <Bus className="w-4 h-4 mr-2" />
                      Associated Buses Warning
                    </h4>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div>
                        This permit has <strong>{assignedBuses.length}</strong> bus{assignedBuses.length !== 1 ? 'es' : ''} associated with it:
                      </div>
                      <div>
                        • <strong>{activeBusesCount}</strong> active buses
                      </div>
                      <div>
                        • <strong>{assignedBuses.length - activeBusesCount}</strong> inactive/pending buses
                      </div>
                      <div className="mt-2 text-orange-800 font-medium">
                        Deleting this permit may affect bus operations and schedules.
                      </div>
                    </div>
                  </div>
                )}

                {/* System Impact Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    System Impact
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• All bus-permit assignments will be removed</li>
                    <li>• Service schedules and timetables will be affected</li>
                    <li>• Route operational permissions will be revoked</li>
                    <li>• Historical permit data will be permanently lost</li>
                    <li>• Trip assignments and operational records will be impacted</li>
                    <li>• Compliance and regulatory records will be deleted</li>
                    <li>• Financial records and fee tracking will be affected</li>
                  </ul>
                </div>

                {/* Alternative Actions Suggestion */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Consider Alternative Actions
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Instead of deleting, you might want to:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Change status to "Suspended" to temporarily halt operations</li>
                    <li>• Update permit validity period for renewal</li>
                    <li>• Transfer permit to another operator</li>
                    <li>• Modify bus allocation limits instead of deletion</li>
                    <li>• Archive the permit for regulatory compliance</li>
                    <li>• Complete ongoing operations before removal</li>
                  </ul>
                </div>

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

                {/* Final Warning */}
                {isConfirmValid && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <p className="text-sm text-red-800 text-center font-medium">
                      ⚠️ You are about to permanently delete this passenger service permit and all associated data.
                      This action cannot be reversed.
                    </p>
                  </div>
                )}
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
                      Deleting Permit...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permit
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