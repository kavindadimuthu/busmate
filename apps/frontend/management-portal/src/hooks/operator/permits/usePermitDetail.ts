import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePageContext } from '@/context/PageContext';
import { getMockPermitById, type OperatorPermitDetail } from '@/data/operator/permits';

export function usePermitDetail() {
  const { setMetadata } = usePageContext();
  const router = useRouter();
  const params = useParams();
  const permitId = params.permitId as string;

  const [permit, setPermit] = useState<OperatorPermitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermit = useCallback(() => {
    if (!permitId) return;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        const data = getMockPermitById(permitId);
        if (data) {
          setPermit(data);
        } else {
          setError(`Permit "${permitId}" was not found.`);
        }
      } catch {
        setError('An unexpected error occurred while loading the permit.');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [permitId]);

  useEffect(() => {
    loadPermit();
  }, [loadPermit]);

  useEffect(() => {
    if (permit) {
      setMetadata({
        title: 'Service Permit Details',
        description: permit.permitNumber,
        breadcrumbs: [
          { label: 'Service Permits', href: '/operator/passenger-service-permits' },
          { label: permit.permitNumber },
        ],
      });
    }
  }, [permit, setMetadata]);

  const handleBack = useCallback(() => {
    router.push('/operator/passenger-service-permits');
  }, [router]);

  const handleRefresh = useCallback(() => {
    loadPermit();
  }, [loadPermit]);

  const handleExport = useCallback(() => {
    window.print();
  }, []);

  return { permit, isLoading, error, handleBack, handleRefresh, handleExport };
}
