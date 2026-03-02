'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Loader2, AlertTriangle } from 'lucide-react';
import { ScheduleForm } from '@/components/mot/schedule-form/ScheduleForm';
import { ScheduleManagementService, ScheduleResponse } from '../../../../../../generated/api-clients/route-management';
import { useSetPageMetadata } from '@/context/PageContext';

export default function EditSchedulePage() {
    const router = useRouter();
    const params = useParams();
    const scheduleId = params.scheduleId as string;

    const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useSetPageMetadata({
        title: 'Edit Schedule',
        description: `Modify schedule: ${schedule?.name || ''}`,
        activeItem: 'schedules',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Schedules', href: '/mot/schedules' }, { label: 'Edit' }],
    });

    // Load existing schedule data
    useEffect(() => {
        const loadSchedule = async () => {
            if (!scheduleId) return;

            try {
                setIsLoadingSchedule(true);
                const response = await ScheduleManagementService.getScheduleById(scheduleId);
                console.log('Loaded schedule:', response);
                setSchedule(response);
            } catch (error) {
                console.error('Error loading schedule:', error);
                setError('Failed to load schedule data');
            } finally {
                setIsLoadingSchedule(false);
            }
        };

        loadSchedule();
    }, [scheduleId]);

    const handleSubmit = async (scheduleData: any) => {
        setIsLoading(true);
        try {
            const response = await ScheduleManagementService.updateScheduleFull(scheduleId, scheduleData);
            // Show success message (you can integrate with a toast system)
            console.log('Schedule updated successfully:', response);

            // Redirect to schedule management page
            router.push(`/mot/schedules/${scheduleId}`);
        } catch (error) {
            console.error('Error updating schedule:', error);
            // Show error message
            throw error; // Re-throw to let the form handle it
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/mot/schedules');
    };

    if (isLoadingSchedule) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading schedule data...</p>
                </div>
            </div>
        );
    }

    if (error || !schedule) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center">
                            <div className="text-red-600 mb-4">
                                <AlertTriangle className="w-12 h-12 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Failed to Load Schedule
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {error || 'The requested schedule could not be found.'}
                            </p>
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Schedules
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <ScheduleForm
                mode="edit"
                initialData={schedule}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </div>
    );
}