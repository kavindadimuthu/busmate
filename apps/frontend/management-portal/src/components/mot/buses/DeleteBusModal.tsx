'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ArrowLeft, Bus, User, Settings } from 'lucide-react';
import { BusResponse } from '@busmate/api-client-route';

interface DeleteBusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    bus: BusResponse | null;
    isDeleting?: boolean;
    tripCount?: number; // Number of trips associated with this bus
}

export default function DeleteBusModal({
    isOpen,
    onClose,
    onConfirm,
    bus,
    isDeleting = false,
    tripCount = 0,
}: DeleteBusModalProps) {
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

    // Parse facilities to show enabled ones
    const parseFacilities = (facilities: any): string[] => {
        if (!facilities) return [];

        try {
            let facilitiesObj: { [key: string]: boolean } = {};

            if (typeof facilities === 'string') {
                facilitiesObj = JSON.parse(facilities);
            } else if (typeof facilities === 'object' && facilities !== null) {
                facilitiesObj = facilities;
            }

            return Object.entries(facilitiesObj)
                .filter(([key, value]) => Boolean(value))
                .map(([key, value]) => formatFacilityName(key));
        } catch (error) {
            return [];
        }
    };

    const formatFacilityName = (key: string): string => {
        const facilityLabels: { [key: string]: string } = {
            'ac': 'Air Conditioning',
            'wifi': 'WiFi',
            'cctv': 'CCTV Cameras',
            'gps': 'GPS Tracking',
            'audio_system': 'Audio System',
            'charging_ports': 'Charging Ports',
            'wheelchair_accessible': 'Wheelchair Accessible',
            'air_suspension': 'Air Suspension',
            'toilet': 'Toilet',
            'tv_screens': 'TV Screens',
            'reading_lights': 'Reading Lights',
            'seat_belts': 'Seat Belts',
            'emergency_exits': 'Emergency Exits',
            'fire_extinguisher': 'Fire Extinguisher'
        };

        return facilityLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const statusInfo = getStatusInfo(bus?.status);
    const enabledFacilities = parseFacilities(bus?.facilities);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'
                    }`}
                onClick={handleBackdropClick}
            />

            {/* Modal */}
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <div
                    className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
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
                                            Delete Bus
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
                                                This will permanently delete the bus and remove all associated data from the system.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bus Details */}
                                {bus && (
                                    <div className="bg-muted rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                                            <Bus className="w-4 h-4 mr-2" />
                                            Bus to be deleted:
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">Plate Number:</span>
                                                <span className="ml-2 text-sm text-foreground font-medium">
                                                    {bus.plateNumber || 'Not assigned'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">NTC Registration:</span>
                                                <span className="ml-2 text-sm text-foreground font-medium">
                                                    {bus.ntcRegistrationNumber || 'Not assigned'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">Bus ID:</span>
                                                <span className="ml-2 text-sm font-mono text-muted-foreground">{bus.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">Model:</span>
                                                <span className="ml-2 text-sm text-foreground">
                                                    {bus.model || 'Not specified'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">Capacity:</span>
                                                <span className="ml-2 text-sm text-foreground">
                                                    {bus.capacity ? `${bus.capacity} passengers` : 'Not specified'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-foreground/80">Operator:</span>
                                                <span className="ml-2 text-sm text-foreground">
                                                    {bus.operatorName || 'Not assigned'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground/80">Status:</span>
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </div>
                                            </div>
                                            {bus.createdAt && (
                                                <div>
                                                    <span className="text-sm font-medium text-foreground/80">Created:</span>
                                                    <span className="ml-2 text-sm text-foreground">
                                                        {new Date(bus.createdAt).toLocaleDateString('en-US', {
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

                                {/* Facilities Information */}
                                {enabledFacilities.length > 0 && (
                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-primary mb-2 flex items-center">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Bus Facilities ({enabledFacilities.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {enabledFacilities.map((facility, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/15 text-primary"
                                                >
                                                    {facility}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Associated Trips Warning */}
                                {tripCount > 0 && (
                                    <div className="bg-warning/10 border border-orange-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-warning mb-2 flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Associated Trips Warning
                                        </h4>
                                        <p className="text-sm text-orange-700">
                                            This bus has <strong>{tripCount}</strong> trip{tripCount !== 1 ? 's' : ''} associated with it.
                                            Deleting this bus will also remove all trip assignments and their data.
                                        </p>
                                    </div>
                                )}

                                {/* Potential Impact Warning */}
                                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-warning mb-2 flex items-center">
                                        <Settings className="w-4 h-4 mr-2" />
                                        System Impact
                                    </h4>
                                    <ul className="text-sm text-warning space-y-1">
                                        <li>• All trip assignments for this bus will be deleted</li>
                                        <li>• Route schedules and operational data will be affected</li>
                                        <li>• Service permits and registrations will be invalidated</li>
                                        <li>• Historical operational data will be permanently lost</li>
                                        <li>• Passenger service records may be impacted</li>
                                        <li>• Financial records and transactions will be affected</li>
                                        <li>• GPS tracking and maintenance records will be lost</li>
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
                                        <li>• Transfer ownership to another operator</li>
                                        <li>• Update bus information if details have changed</li>
                                        <li>• Archive the bus for future reference</li>
                                        <li>• Complete ongoing trips before removal</li>
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
                                            ⚠️ You are about to permanently delete this bus and all associated data.
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
                                            Deleting Bus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Bus
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