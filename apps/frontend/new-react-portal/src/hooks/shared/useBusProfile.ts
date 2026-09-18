'use client';

import { useCallback, useEffect, useState } from 'react';
import { BusManagementService, BusProfileService } from '@busmate/api-client-core';
import type { BusMediaResponse, BusPassengerServicePermitAssignmentResponse, BusResponse } from '@busmate/api-client-core';
import { apiErrorMessage } from '@/lib/api/errors';

/** A bus with its photos, documents and permit links (INC-018). Used by operator and MOT pages. */
export function useBusProfile(busId?: string) {
  const [bus, setBus] = useState<BusResponse | null>(null);
  const [media, setMedia] = useState<BusMediaResponse[]>([]);
  const [links, setLinks] = useState<BusPassengerServicePermitAssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!busId) return;
    setError(null);
    try {
      const [b, m, l] = await Promise.all([
        BusManagementService.getBusById(busId),
        BusProfileService.listBusMedia(busId),
        BusProfileService.getBusPermitLinks(busId),
      ]);
      setBus(b);
      setMedia(m);
      setLinks(l);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the bus'));
    } finally {
      setIsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    bus,
    photos: media.filter((m) => m.kind === 'PHOTO'),
    documents: media.filter((m) => m.kind === 'DOCUMENT'),
    links,
    isLoading,
    error,
    reload: load,
  };
}
