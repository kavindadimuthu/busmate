'use client';

import { XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@busmate/ui';

interface TripDetailsModalsProps {
  showDeleteModal: boolean;
  showCancelModal: boolean;
  isDeleting: boolean;
  isCancelling: boolean;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onCancelConfirm: (reason?: string) => void;
  onCancelModalClose: () => void;
}

export function TripDetailsModals({
  showDeleteModal, showCancelModal, isDeleting, isCancelling,
  onDeleteCancel, onDeleteConfirm, onCancelConfirm, onCancelModalClose,
}: TripDetailsModalsProps) {
  return (
    <>
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onDeleteCancel} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <XCircle className="h-6 w-6 text-destructive mr-3" />
                <h3 className="text-lg font-medium text-foreground">Confirm Delete</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this trip? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onDeleteCancel}>Cancel</Button>
                <Button variant="destructive" onClick={onDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                  ) : 'Delete Trip'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showCancelModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onCancelModalClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-warning mr-3" />
                <h3 className="text-lg font-medium text-foreground">Cancel Trip</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to cancel this trip?
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onCancelModalClose}>Cancel</Button>
                <Button variant="destructive" onClick={() => onCancelConfirm()} disabled={isCancelling}>
                  {isCancelling ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Cancelling...</>
                  ) : 'Cancel Trip'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
