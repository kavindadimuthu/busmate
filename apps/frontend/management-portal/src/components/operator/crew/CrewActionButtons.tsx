'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@busmate/ui';

interface CrewActionButtonsProps {
  onAddConductor: () => void;
  isLoading?: boolean;
}

export function CrewActionButtons({ onAddConductor, isLoading = false }: CrewActionButtonsProps) {
  return (
    <Button onClick={onAddConductor} disabled={isLoading}>
      <UserPlus className="h-4 w-4" />
      Add Conductor
    </Button>
  );
}
