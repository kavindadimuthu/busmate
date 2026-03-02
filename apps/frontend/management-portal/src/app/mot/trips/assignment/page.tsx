'use client';

import { TripAssignment } from '@/components/mot/trip-assignment';
import { useSetPageMetadata } from '@/context/PageContext';

export default function TripAssignmentPage() {
  useSetPageMetadata({
    title: 'Trip Assignment',
    description: 'Assign weekly schedule instances/trips to passenger service permits',
    activeItem: 'trip-assignment',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trip Assignment' }],
    padding: 0,
  });

  return (
      <TripAssignment />
  );
}
