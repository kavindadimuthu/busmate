import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PermitManagementService,
  OperatorManagementService,
  RouteManagementService,
  PassengerServicePermitRequest,
  OperatorResponse,
  RouteGroupResponse,
} from '@busmate/api-client-route';

export function useAddPermit() {
  const router = useRouter();

  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroupResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);
  const [routeGroupsLoading, setRouteGroupsLoading] = useState(true);

  const loadFormData = useCallback(async () => {
    try {
      setOperatorsLoading(true);
      setRouteGroupsLoading(true);

      const [operatorsList, routeGroupsList] = await Promise.all([
        OperatorManagementService.getAllOperatorsAsList(),
        RouteManagementService.getAllRouteGroupsAsList(),
      ]);

      setOperators(operatorsList || []);
      setRouteGroups(routeGroupsList || []);
    } catch (err) {
      console.error('Error loading form data:', err);
      setError('Failed to load operators and route groups. Please try again.');
    } finally {
      setOperatorsLoading(false);
      setRouteGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const handleSubmit = async (permitData: PassengerServicePermitRequest): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await PermitManagementService.createPermit(permitData);

      if (response.id) {
        router.push(`/mot/passenger-service-permits/${response.id}`);
      } else {
        router.push('/mot/passenger-service-permits');
      }
    } catch (err) {
      console.error('Error creating permit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create permit. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
    }
  };

  const dismissError = () => setError(null);

  return {
    operators,
    routeGroups,
    isSubmitting,
    error,
    operatorsLoading,
    routeGroupsLoading,
    handleSubmit,
    handleCancel,
    dismissError,
  };
}

const requirements = [
  'Operator must be registered and active',
  'Route group must be defined with routes',
  'Permit number must be unique',
  'All required documents must be available',
];

const nextSteps = [
  'Assign buses to the permit',
  'Create service schedules',
  'Monitor permit compliance',
  'Handle renewals before expiry',
];

function renderList(items: string[]) {
  return React.createElement('ul', { className: 'space-y-1' },
    ...items.map((t, i) => React.createElement('li', { key: i }, `\u2022 ${t}`))
  );
}

export function PermitHelperInfo() {
  return React.createElement('div', { className: 'bg-muted rounded-lg border border-border p-6' },
    React.createElement('h3', { className: 'text-lg font-semibold text-foreground mb-4' }, 'Before Creating a Permit'),
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground' },
      React.createElement('div', null,
        React.createElement('h4', { className: 'font-medium text-foreground mb-2' }, 'Requirements'),
        renderList(requirements)
      ),
      React.createElement('div', null,
        React.createElement('h4', { className: 'font-medium text-foreground mb-2' }, 'Next Steps'),
        renderList(nextSteps)
      )
    )
  );
}
