import React from "react";
import { X, AlertTriangle, Power, Send } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  isLoading: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/5 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to permanently delete{" "}
            <span className="font-medium">{itemName}</span>? This will remove
            all associated data and cannot be recovered.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-red-600 to-red-700 border border-transparent rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SendConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/5 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center shadow-sm">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                This will send the message immediately
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to send{" "}
            <span className="font-medium">{itemName}</span> now? This will deliver
            the message immediately to all recipients.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-green-600 to-emerald-700 border border-transparent rounded-lg hover:from-green-700 hover:to-emerald-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeactivationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/5 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-yellow-100 to-amber-50 rounded-full flex items-center justify-center shadow-sm">
              <Power className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                This will suspend operations
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to deactivate{" "}
            <span className="font-medium">{itemName}</span>? This will suspend
            all operations for this item. You can reactivate it later if needed.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-yellow-600 to-amber-700 border border-transparent rounded-lg hover:from-yellow-700 hover:to-amber-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deactivating...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Deactivate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
