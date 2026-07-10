'use client';

import { useState } from 'react';
import { MoreVertical, UserPlus, UserMinus, Eye, Edit, Trash2 } from 'lucide-react';
import type { TripResponse, PassengerServicePermitResponse } from '@busmate/api-client-route';

interface TripContextMenuProps {
  trip: TripResponse;
  permits: PassengerServicePermitResponse[];
  onAssignPsp: (tripId: string, pspId: string) => void;
  onRemovePsp: (tripId: string) => void;
  onViewDetails: (tripId: string) => void;
}

export function TripContextMenu({
  trip,
  permits,
  onAssignPsp,
  onRemovePsp,
  onViewDetails,
}: TripContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPspSelect, setShowPspSelect] = useState(false);

  const availablePsps = permits.filter(psp => 
    psp.status === 'ACTIVE' && (psp.maximumBusAssigned || 0) > 0
  );

  const handleAssignPsp = (pspId: string) => {
    if (trip.id) {
      onAssignPsp(trip.id, pspId);
    }
    setIsOpen(false);
    setShowPspSelect(false);
  };

  const handleRemovePsp = () => {
    if (trip.id) {
      onRemovePsp(trip.id);
    }
    setIsOpen(false);
  };

  const handleViewDetails = () => {
    if (trip.id) {
      onViewDetails(trip.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-lg hover:bg-muted transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowPspSelect(false);
            }}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-48">
            {!showPspSelect ? (
              <>
                <button
                  onClick={handleViewDetails}
                  className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-muted flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>

                {trip.passengerServicePermitId ? (
                  <button
                    onClick={handleRemovePsp}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center space-x-2"
                  >
                    <UserMinus className="h-4 w-4" />
                    <span>Remove PSP</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPspSelect(true)}
                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/10 flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Assign PSP</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-2 text-sm font-medium text-foreground border-b border-border">
                  Select PSP to Assign
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {availablePsps.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      No available PSPs
                    </div>
                  ) : (
                    availablePsps.map((psp) => (
                      <button
                        key={psp.id}
                        onClick={() => psp.id && handleAssignPsp(psp.id)}
                        className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-muted"
                      >
                        <div className="font-medium">{psp.permitNumber}</div>
                        <div className="text-xs text-muted-foreground">{psp.operatorName}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-border">
                  <button
                    onClick={() => setShowPspSelect(false)}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}