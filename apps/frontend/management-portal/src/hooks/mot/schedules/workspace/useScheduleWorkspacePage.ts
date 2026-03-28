'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import React from 'react';

export type WorkspaceTab = 'form' | 'textual' | 'ai-studio';

export function useScheduleWorkspacePage() {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('form');
    const {
        mode, validateAllSchedules, submitAllSchedules, resetToCreateMode,
        data, setSelectedRoute, setActiveScheduleIndex, setHighlightedScheduleIndex, isLoading,
    } = useScheduleWorkspace();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { schedules } = data;

    useSetPageMetadata({
        title: 'Schedules Workspace',
        description: 'Create and manage bus schedules',
        activeItem: 'schedules',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Schedules', href: '/mot/schedules' }, { label: 'Workspace' }],
        padding: 0,
    }, true);

    // Load route from query param on mount
    useEffect(() => {
        const routeIdParam = searchParams.get('routeId');
        if (routeIdParam && !isLoading && data.availableRoutes.length > 0 && !data.selectedRouteId) {
            const routeExists = data.availableRoutes.some(route => route.id === routeIdParam);
            if (routeExists) {
                setSelectedRoute(routeIdParam);
            }
        }
    }, [searchParams, setSelectedRoute, isLoading, data.availableRoutes, data.selectedRouteId]);

    // Highlight and select specific schedule if scheduleId param is provided
    useEffect(() => {
        const scheduleIdParam = searchParams.get('scheduleId');
        if (scheduleIdParam && data.schedules.length > 0) {
            const scheduleIndex = data.schedules.findIndex(s => s.id === scheduleIdParam);
            if (scheduleIndex !== -1) {
                setActiveScheduleIndex(scheduleIndex);
                setHighlightedScheduleIndex(scheduleIndex);
            }
        }
    }, [searchParams, data.schedules, setActiveScheduleIndex, setHighlightedScheduleIndex]);

    const handleSubmit = async () => {
        const validation = validateAllSchedules();

        if (!validation.valid) {
            const errorMessages = validation.scheduleErrors.flatMap((scheduleError, idx) =>
                scheduleError.errors.map(error => `Schedule ${idx + 1} (${schedules[idx]?.name || 'Unnamed'}): ${error}`)
            );

            toast({
                title: `Validation Failed (${validation.invalidCount} of ${schedules.length} schedules have errors)`,
                description: React.createElement('ul', { className: 'list-disc pl-4 mt-2 max-h-48 overflow-y-auto' },
                    ...errorMessages.slice(0, 10).map((error, index) =>
                        React.createElement('li', { key: index, className: 'text-sm' }, error)
                    ),
                    ...(errorMessages.length > 10
                        ? [React.createElement('li', { key: 'more', className: 'text-sm text-muted-foreground' }, `...and ${errorMessages.length - 10} more errors`)]
                        : [])
                ),
                variant: 'destructive',
            });
            return;
        }

        try {
            await submitAllSchedules();
            toast({
                title: 'All Schedules Data Ready',
                description: `${schedules.length} schedule(s) validated. Check the browser console to see the final data that would be sent to the API.`,
            });
        } catch (error) {
            toast({
                title: 'Submission Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            });
        }
    };

    const handleReset = async () => {
        if (confirm('Are you sure you want to reset all changes and start fresh?')) {
            await resetToCreateMode();
            toast({
                title: 'Workspace Reset',
                description: 'The schedule workspace has been reset.',
            });
        }
    };

    return { activeTab, setActiveTab, handleSubmit, handleReset };
}
