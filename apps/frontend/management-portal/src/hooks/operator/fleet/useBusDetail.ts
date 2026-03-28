import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePageContext } from '@/context/PageContext';
import { getOperatorBusById, type OperatorBus } from '@/data/operator/buses';

export function useBusDetail() {
  const { setMetadata } = usePageContext();
  const router = useRouter();
  const params = useParams();
  const busId = params.busId as string;

  const [bus, setBus] = useState<OperatorBus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBus = useCallback(async () => {
    if (!busId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOperatorBusById(busId);
      setBus(data);
    } catch (err) {
      console.error('Error loading bus:', err);
      setError('Bus not found or failed to load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [busId]);

  useEffect(() => { loadBus(); }, [loadBus]);

  useEffect(() => {
    if (bus) {
      setMetadata({
        title: bus.plateNumber,
        description: `${bus.manufacturer} ${bus.model} · Bus details – read-only view`,
        breadcrumbs: [
          { label: 'Fleet Management', href: '/operator/fleet-management' },
          { label: bus.plateNumber },
        ],
      });
    }
  }, [bus, setMetadata]);

  const handleRefresh = useCallback(async () => {
    await loadBus();
  }, [loadBus]);

  return { bus, isLoading, error, handleRefresh };
}
