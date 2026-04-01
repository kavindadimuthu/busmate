'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import { StopResponse } from '@busmate/api-client-route';

interface DeleteBusStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  busStop: StopResponse | null;
  isDeleting?: boolean;
}

export default function DeleteBusStopModal({
  isOpen,
  onClose,
  onConfirm,
  busStop,
  isDeleting = false,
}: DeleteBusStopModalProps) {
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
                      Delete Bus Stop
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
                {/* Warning Message */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-destructive">
                        This action cannot be undone
                      </h4>
                      <p className="text-sm text-destructive mt-1">
                        This will permanently delete the bus stop and remove all associated data from the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bus Stop Details */}
                {busStop && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Bus Stop to be deleted:
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-foreground/80">Name:</span>
                        <span className="ml-2 text-sm text-foreground">{busStop.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground/80">ID:</span>
                        <span className="ml-2 text-sm font-mono text-muted-foreground">{busStop.id}</span>
                      </div>
                      {busStop.location?.address && (
                        <div>
                          <span className="text-sm font-medium text-foreground/80">Address:</span>
                          <span className="ml-2 text-sm text-foreground">{busStop.location.address}</span>
                        </div>
                      )}
                      {busStop.location?.city && busStop.location?.state && (
                        <div>
                          <span className="text-sm font-medium text-foreground/80">Location:</span>
                          <span className="ml-2 text-sm text-foreground">
                            {busStop.location.city}, {busStop.location.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Potential Impact Warning */}
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-warning mb-2">
                    Potential Impact
                  </h4>
                  <ul className="text-sm text-warning space-y-1">
                    <li>• Routes using this stop may be affected</li>
                    <li>• Scheduled services will need to be updated</li>
                    <li>• Historical data will be permanently lost</li>
                    <li>• Passengers may be impacted if this stop is currently in use</li>
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
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Bus Stop
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