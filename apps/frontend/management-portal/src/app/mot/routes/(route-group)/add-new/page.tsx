'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { RouteForm, type RouteGroupFormData } from '@/components/mot/routes/route-form/RouteForm';
import { RouteManagementService } from '../../../../../../generated/api-clients/route-management';
import type { RouteGroupRequest } from '../../../../../../generated/api-clients/route-management';

export default function AddNewRouteGroupPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Route Group',
    description: 'Create a new route group',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: 'Add New' }],
  });

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Helper function to build complete route stops array
  const buildCompleteRouteStops = (routeData: RouteGroupFormData['outboundRoute']) => {
    const allStops = [];
    
    // 1. Add start stop (order 0)
    allStops.push({
      stopId: routeData.startStopId,
      stopOrder: 0,
      distanceFromStartKm: 0
    });
    
    // 2. Add intermediate stops (order 1, 2, 3, ...)
    routeData.routeStops.forEach((stop, index) => {
      allStops.push({
        stopId: stop.stopId,
        stopOrder: index + 1,
        distanceFromStartKm: stop.distanceFromStartKm
      });
    });
    
    // 3. Add end stop (final order)
    allStops.push({
      stopId: routeData.endStopId,
      stopOrder: routeData.routeStops.length + 1,
      distanceFromStartKm: routeData.distanceKm
    });
    
    return allStops;
  };

  // Create Route Group
  const handleCreateRouteGroup = async (formData: RouteGroupFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare route group data for API
      const routeGroupRequest: RouteGroupRequest = {
        name: formData.name,
        nameSinhala: formData.nameSinhala,
        nameTamil: formData.nameTamil,
        description: formData.description,
        routes: [
          // Outbound route
          {
            name: formData.outboundRoute.name,
            nameSinhala: formData.outboundRoute.nameSinhala,
            nameTamil: formData.outboundRoute.nameTamil,
            description: formData.outboundRoute.description,
            direction: formData.outboundRoute.direction,
            routeNumber: formData.outboundRoute.routeNumber,
            roadType: formData.outboundRoute.roadType,
            routeThrough: formData.outboundRoute.routeThrough,
            routeThroughSinhala: formData.outboundRoute.routeThroughSinhala,
            routeThroughTamil: formData.outboundRoute.routeThroughTamil,
            startStopId: formData.outboundRoute.startStopId,
            endStopId: formData.outboundRoute.endStopId,
            distanceKm: formData.outboundRoute.distanceKm,
            estimatedDurationMinutes: formData.outboundRoute.estimatedDurationMinutes,
            routeStops: buildCompleteRouteStops(formData.outboundRoute)
          },
          // Inbound route
          {
            name: formData.inboundRoute.name,
            nameSinhala: formData.inboundRoute.nameSinhala,
            nameTamil: formData.inboundRoute.nameTamil,
            description: formData.inboundRoute.description,
            direction: formData.inboundRoute.direction,
            routeNumber: formData.inboundRoute.routeNumber,
            roadType: formData.inboundRoute.roadType,
            routeThrough: formData.inboundRoute.routeThrough,
            routeThroughSinhala: formData.inboundRoute.routeThroughSinhala,
            routeThroughTamil: formData.inboundRoute.routeThroughTamil,
            startStopId: formData.inboundRoute.startStopId,
            endStopId: formData.inboundRoute.endStopId,
            distanceKm: formData.inboundRoute.distanceKm,
            estimatedDurationMinutes: formData.inboundRoute.estimatedDurationMinutes,
            routeStops: buildCompleteRouteStops(formData.inboundRoute)
          }
        ]
      };

      const createdRouteGroup = await RouteManagementService.createRouteGroup(routeGroupRequest);
      
      // Redirect to the created route group details page
      router.push(`/mot/routes/${createdRouteGroup.id}`);
      
    } catch (error) {
      console.error('Error creating route group:', error);
      setError('Failed to create route group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async (formData: RouteGroupFormData) => {
    try {
      setIsSavingDraft(true);
      
      // For now, just save to localStorage (could be extended to API)
      const draftData = {
        ...formData,
        lastSaved: new Date().toISOString(),
        isDraft: true
      };
      
      localStorage.setItem('routeGroupDraft', JSON.stringify(draftData));
      
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCancel = () => {
    // Clear any draft
    localStorage.removeItem('routeGroupDraft');
    router.push('/mot/routes');
  };

  return (
      <div className="space-y-6">
        {/* Route Form */}
        <RouteForm
          mode="create"
          onSubmit={handleCreateRouteGroup}
          onCancel={handleCancel}
          onSaveDraft={handleSaveDraft}
          isLoading={isLoading}
          isSavingDraft={isSavingDraft}
          error={error}
          validationErrors={validationErrors}
          onErrorChange={setError}
          onValidationErrorsChange={setValidationErrors}
        />
      </div>
  );
}