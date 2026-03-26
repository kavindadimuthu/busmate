'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ArrowLeft, Building, Bus, Users } from 'lucide-react';
import { OperatorResponse } from '@busmate/api-client-route';

interface DeleteOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  operator: OperatorResponse | null;
  isDeleting?: boolean;
  busCount?: number; // Number of buses associated with this operator
}

export default function DeleteOperatorModal({
  isOpen,
  onClose,
  onConfirm,
  operator,
  isDeleting = false,
  busCount = 0,
}: DeleteOperatorModalProps) {
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

  // Get operator type label
  const getOperatorTypeLabel = (type?: string) => {
    switch (type) {
      case 'PRIVATE':
        return 'Private Operator';
      case 'CTB':
        return 'Ceylon Transport Board (CTB)';
      default:
        return type || 'Unknown';
    }
  };

  // Get status color and label
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'text-success bg-success/10 border-success/20' };
      case 'pending':
        return { label: 'Pending', color: 'text-warning bg-warning/10 border-warning/20' };
      case 'inactive':
        return { label: 'Inactive', color: 'text-destructive bg-destructive/10 border-destructive/20' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-muted-foreground bg-muted border-border' };
      default:
        return { label: status || 'Unknown', color: 'text-muted-foreground bg-muted border-border' };
    }
  };

  const statusInfo = getStatusInfo(operator?.status);

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
          <div className="flex h-full flex-col bg-card shadow-xl">
            {/* Header */}
            <div className="bg-card px-8 py-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-foreground">
                      Delete Operator
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="rounded-md text-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="space-y-6">
                {/* Critical Warning Message */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-destructive">
                        ⚠️ Critical Action - Cannot be undone
                      </h4>
                      <p className="text-sm text-destructive mt-1">
                        This will permanently delete the operator and remove all associated data from the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operator Details */}
                {operator && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      Operator to be deleted:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-foreground/80">Name:</span>
                        <span className="ml-2 text-sm text-foreground font-medium">{operator.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground/80">ID:</span>
                        <span className="ml-2 text-sm font-mono text-muted-foreground">{operator.id}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground/80">Type:</span>
                        <span className="ml-2 text-sm text-foreground">{getOperatorTypeLabel(operator.operatorType)}</span>
                      </div>
                      {operator.region && (
                        <div>
                          <span className="text-sm font-medium text-foreground/80">Region:</span>
                          <span className="ml-2 text-sm text-foreground">{operator.region}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground/80">Status:</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </div>
                      </div>
                      {operator.createdAt && (
                        <div>
                          <span className="text-sm font-medium text-foreground/80">Created:</span>
                          <span className="ml-2 text-sm text-foreground">
                            {new Date(operator.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Associated Assets Warning */}
                {busCount > 0 && (
                  <div className="bg-warning/10 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-warning mb-2 flex items-center">
                      <Bus className="w-4 h-4 mr-2" />
                      Associated Buses Warning
                    </h4>
                    <p className="text-sm text-orange-700">
                      This operator has <strong>{busCount}</strong> bus{busCount !== 1 ? 'es' : ''} associated with it. 
                      Deleting this operator will also remove all associated buses and their data.
                    </p>
                  </div>
                )}

                {/* Potential Impact Warning */}
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-warning mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    System Impact
                  </h4>
                  <ul className="text-sm text-warning space-y-1">
                    <li>• All buses registered to this operator will be deleted</li>
                    <li>• Route assignments and schedules will be affected</li>
                    <li>• Service permits and licenses will be invalidated</li>
                    <li>• Historical operational data will be permanently lost</li>
                    <li>• Financial records and transactions may be impacted</li>
                    <li>• Passenger services may be disrupted</li>
                  </ul>
                </div>

                {/* Alternative Actions Suggestion */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-primary mb-2">
                    Consider Alternative Actions
                  </h4>
                  <p className="text-sm text-primary mb-2">
                    Instead of deleting, you might want to:
                  </p>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• Change status to "Inactive" to suspend operations</li>
                    <li>• Transfer buses to another operator</li>
                    <li>• Update operator information if details have changed</li>
                    <li>• Archive the operator for future reference</li>
                  </ul>
                </div>

                {/* Confirmation Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Type <span className="font-mono bg-muted px-1 rounded">{requiredText}</span> to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Type "${requiredText}" to confirm`}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-destructive disabled:bg-muted disabled:opacity-50"
                    autoComplete="off"
                  />
                  {confirmText && !isConfirmValid && (
                    <p className="mt-1 text-sm text-destructive">
                      Please type exactly "{requiredText}" to confirm
                    </p>
                  )}
                </div>

                {/* Final Warning */}
                {isConfirmValid && (
                  <div className="bg-destructive/15 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm text-destructive text-center font-medium">
                      ⚠️ You are about to permanently delete this operator and all associated data. 
                      This action cannot be reversed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground/80 bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isConfirmValid || isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting Operator...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Operator
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