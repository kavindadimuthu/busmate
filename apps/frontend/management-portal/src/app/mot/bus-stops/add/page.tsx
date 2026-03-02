'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect page for legacy /add URL
export default function BusStopsAddRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the correct add page
    router.replace('/mot/bus-stops/add-new');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}