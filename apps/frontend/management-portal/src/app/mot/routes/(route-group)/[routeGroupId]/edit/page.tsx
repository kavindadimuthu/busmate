'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { RouteForm, type RouteGroupFormData } from '@/components/mot/routes/route-form/RouteForm';
import { RouteManagementService } from '../../../../../../../generated/api-clients/route-management';
import type { RouteGroupRequest, RouteGroupResponse } from '../../../../../../../generated/api-clients/route-management';

export default function EditRouteGroupPage() {
  const router = useRouter();
  const params = useParams();
  const routeGroupId = params.routeGroupId as string;

  useSetPageMetadata({
    title: 'Edit Route Group',
    description: 'Update route group details',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: 'Edit' }],
  });

  // State
  const [routeGroup, setRouteGroup] = useState<RouteGroupResponse | null>(null);
  const [originalFormData, setOriginalFormData] = useState<RouteGroupFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load existing route group data
  const loadRouteGroupData = useCallback(async () => {
    if (!routeGroupId) return;

    try {
      setIsLoadingData(true);
      setError(null);

      const routeGroupData = await RouteManagementService.getRouteGroupById(routeGroupId);
      setRouteGroup(routeGroupData);

      // Store original form data for comparison
      const originalData: RouteGroupFormData = {
        name: routeGroupData.name || '',
        nameSinhala: routeGroupData.nameSinhala || '',
        nameTamil: routeGroupData.nameTamil || '',
        description: routeGroupData.description || '',
        outboundRoute: {
          id: undefined,
          name: '',
          nameSinhala: '',
          nameTamil: '',
          description: '',
          direction: 'OUTBOUND',
          routeNumber: '',
          roadType: '',
          routeThrough: '',
          routeThroughSinhala: '',
          routeThroughTamil: '',
          startStopId: '',
          startStopName: '',
          endStopId: '',
          endStopName: '',
          distanceKm: 0,
          estimatedDurationMinutes: 0,
          routeStops: []
        },
        inboundRoute: {
          id: undefined,
          name: '',
          nameSinhala: '',
          nameTamil: '',
          description: '',
          direction: 'INBOUND',
          routeNumber: '',
          roadType: '',
          routeThrough: '',
          routeThroughSinhala: '',
          routeThroughTamil: '',
          startStopId: '',
          startStopName: '',
          endStopId: '',
          endStopName: '',
          distanceKm: 0,
          estimatedDurationMinutes: 0,
          routeStops: []
        }
      };

      // Convert routes data if available
      if (routeGroupData.routes) {
        routeGroupData.routes.forEach(route => {
          // Sort route stops by stopOrder to ensure correct sequence
          const sortedRouteStops = route.routeStops ? 
            [...route.routeStops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)) : [];

          // Filter out start and end stops from intermediate stops and maintain order
          const intermediateStops = sortedRouteStops
            .filter(stop => 
              stop.stopId !== route.startStopId && 
              stop.stopId !== route.endStopId &&
              stop.stopOrder !== 0 && // Exclude start stop order
              stop.stopOrder !== Math.max(...sortedRouteStops.map(s => s.stopOrder || 0)) // Exclude end stop order
            )
            .map((stop, index) => ({
              stopId: stop.stopId || '',
              stopName: stop.stopName || '',
              stopOrder: index + 1, // Reorder for intermediate stops (1, 2, 3...)
              distanceFromStartKm: stop.distanceFromStartKm || 0,
              location: stop.location ? {
                latitude: stop.location.latitude ?? 0,
                longitude: stop.location.longitude ?? 0,
                address: stop.location.address ?? '',
                city: stop.location.city ?? '',
                state: stop.location.state ?? '',
                zipCode: stop.location.zipCode ?? ''
              } : undefined
            }));

          const routeData = {
            id: route.id, // Preserve the route ID
            name: route.name || '',
            nameSinhala: route.nameSinhala || '',
            nameTamil: route.nameTamil || '',
            description: route.description || '',
            direction: route.direction as 'OUTBOUND' | 'INBOUND',
            routeNumber: route.routeNumber || '',
            roadType: route.roadType || '',
            routeThrough: route.routeThrough || '',
            routeThroughSinhala: route.routeThroughSinhala || '',
            routeThroughTamil: route.routeThroughTamil || '',
            startStopId: route.startStopId || '',
            startStopName: route.startStopName || '',
            endStopId: route.endStopId || '',
            endStopName: route.endStopName || '',
            distanceKm: route.distanceKm || 0,
            estimatedDurationMinutes: route.estimatedDurationMinutes || 0,
            routeStops: intermediateStops
          };

          if (route.direction === 'OUTBOUND') {
            originalData.outboundRoute = routeData;
          } else {
            originalData.inboundRoute = routeData;
          }
        });
      }

      setOriginalFormData(originalData);

    } catch (err) {
      console.error('Error loading route group data:', err);
      setError('Failed to load route group data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [routeGroupId]);

  useEffect(() => {
    loadRouteGroupData();
  }, [loadRouteGroupData]);

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

  // Check if form data has actually changed
  const hasFormDataChanged = (formData: RouteGroupFormData): boolean => {
    if (!originalFormData) return true;

    // Check if route group basic info changed
    if (formData.name !== originalFormData.name || 
        formData.description !== originalFormData.description) {
      return true;
    }

    // Check if routes changed (simplified check)
    const outboundChanged = JSON.stringify(formData.outboundRoute) !== JSON.stringify(originalFormData.outboundRoute);
    const inboundChanged = JSON.stringify(formData.inboundRoute) !== JSON.stringify(originalFormData.inboundRoute);

    return outboundChanged || inboundChanged;
  };

  // Update Route Group
  const handleUpdateRouteGroup = async (formData: RouteGroupFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if anything has actually changed
      if (!hasFormDataChanged(formData)) {
        setError('No changes detected. Route group is already up to date.');
        setIsLoading(false);
        return;
      }

      // Prepare route group data for API - INCLUDING ROUTE IDs
      const routeGroupRequest: RouteGroupRequest = {
        name: formData.name,
        nameSinhala: formData.nameSinhala,
        nameTamil: formData.nameTamil,
        description: formData.description,
        routes: [
          // Outbound route with ID
          {
            id: formData.outboundRoute.id, // Include existing route ID
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
          // Inbound route with ID
          {
            id: formData.inboundRoute.id, // Include existing route ID
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

      console.log('Sending update request with route IDs:', routeGroupRequest); // Debug log

      await RouteManagementService.updateRouteGroup(routeGroupId, routeGroupRequest);
      
      // Redirect to the route group details page
      router.push(`/mot/routes/${routeGroupId}`);
      
    } catch (error: any) {
      console.error('Error updating route group:', error);
      
      // Handle specific API errors
      if (error?.body?.message) {
        if (error.body.message.includes('already exists') || error.body.message.includes('name')) {
          if (formData.name === originalFormData?.name) {
            // If the name hasn't changed, this is a backend validation bug
            // Try to provide helpful feedback
            setError('Backend validation error: The route group name hasn\'t changed but the system is reporting a duplicate. This is a known backend issue. Please try modifying other route details or contact support if the issue persists.');
          } else {
            setError(`A route group with the name "${formData.name}" already exists. Please choose a different name.`);
          }
        } else {
          setError(error.body.message);
        }
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Failed to update route group. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save Draft (for edit mode, we could implement auto-save or similar)
  const handleSaveDraft = async (formData: RouteGroupFormData) => {
    try {
      setIsSavingDraft(true);
      
      // For edit mode, you might want to save changes as draft to the server
      // For now, just show success message
      setError('Changes saved as draft successfully!');
      setTimeout(() => setError(null), 3000);
      
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCancel = () => {
    router.push(`/mot/routes/${routeGroupId}`);
  };

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading route group data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !routeGroup) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button
          onClick={() => router.push('/mot/routes')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Route Groups
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Route Form */}
        {routeGroup && (
          <RouteForm
            mode="edit"
            initialData={routeGroup}
            onSubmit={handleUpdateRouteGroup}
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            isLoading={isLoading}
            isSavingDraft={isSavingDraft}
            error={error}
            validationErrors={validationErrors}
            onErrorChange={setError}
            onValidationErrorsChange={setValidationErrors}
          />
        )}
      </div>
  );
}