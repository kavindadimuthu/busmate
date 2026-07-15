import { useState, useCallback, useEffect } from 'react';
import { useParams } from '@/lib/router';
import { usePageContext } from '@/context/PageContext';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type { BusResponse } from '@busmate/api-client-core';
import { useMyOperator } from '@/hooks/operator/useMyOperator';

export function useBusDetail() {
  const { setMetadata } = usePageContext();
  const params = useParams();
  const busId = params.busId as string;

  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const [bus, setBus] = useState<BusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBus = useCallback(async () => {
    if (!busId || !operator?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await BusOperatorOperationsService.getOperatorBusById(operator.id, busId);
      setBus(data);
    } catch (err) {
      console.error('Error loading bus:', err);
      setError('Bus not found or failed to load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [busId, operator?.id]);

  useEffect(() => { loadBus(); }, [loadBus]);

  useEffect(() => {
    if (bus) {
      setMetadata({
        title: bus.plateNumber,
        description: `${bus.model ?? 'Bus'} · Bus details – read-only view`,
        breadcrumbs: [
          { label: 'Fleet Management', href: '/operator/fleet' },
          { label: bus.plateNumber ?? 'Bus Details' },
        ],
      });
    }
  }, [bus, setMetadata]);

  const handleRefresh = useCallback(async () => {
    await loadBus();
  }, [loadBus]);

  return {
    bus,
    isLoading: isLoading || operatorLoading,
    error: error ?? operatorError,
    handleRefresh,
  };
}
