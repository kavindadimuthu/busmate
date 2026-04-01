import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePageContext } from '@/context/PageContext';
import { getStaffById, type StaffMember } from '@/data/operator/staff';

export function useStaffDetail() {
  const { setMetadata } = usePageContext();
  const params = useParams();
  const staffId = params?.staffId as string;

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!staffId) return;
    let mounted = true;
    (async () => {
      const data = await getStaffById(staffId);
      if (mounted) {
        if (!data) setNotFound(true);
        else setStaff(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [staffId]);

  useEffect(() => {
    if (staff) {
      const isDriver = staff.role === 'DRIVER';
      setMetadata({
        title: 'Staff Profile Details',
        description: `${isDriver ? 'Driver' : 'Conductor'} Profile`,
        breadcrumbs: [
          { label: 'Staff Management', href: '/operator/staff' },
          { label: staff.fullName },
        ],
      });
    }
  }, [staff, setMetadata]);

  return { staff, loading, notFound };
}
