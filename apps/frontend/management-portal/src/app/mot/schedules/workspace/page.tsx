'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import ScheduleFormMode from '@/components/mot/schedules/workspace/form-mode/ScheduleFormMode';
import ScheduleTextualMode from '@/components/mot/schedules/workspace/textual-mode/ScheduleTextualMode';
import { ScheduleAIStudio } from '@/components/mot/schedules/workspace/ai-studio';
import { ScheduleWorkspaceProvider, useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { Sparkles } from 'lucide-react';

function ScheduleWorkspaceContent() {
    const [activeTab, setActiveTab] = useState<'form' | 'textual' | 'ai-studio'>('form');
    const { mode, validateAllSchedules, submitAllSchedules, resetToCreateMode, data, setSelectedRoute, isLoading } = useScheduleWorkspace();
    const { toast } = useToast();

    useSetPageMetadata({
        title: 'Schedules Workspace',
        description: 'Create and manage bus schedules',
        activeItem: 'schedules',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Schedules', href: '/mot/schedules' }, { label: 'Workspace' }],
        padding: 0,
    });
    const { schedules } = data;
    const searchParams = useSearchParams();

    // Load route from query param on mount
    useEffect(() => {
        const routeIdParam = searchParams.get('routeId');
        if (routeIdParam && !isLoading && data.availableRoutes.length > 0 && !data.selectedRouteId) {
            // Check if route exists in available routes
            const routeExists = data.availableRoutes.some(route => route.id === routeIdParam);
            if (routeExists) {
                setSelectedRoute(routeIdParam);
            }
        }
    }, [searchParams, setSelectedRoute, isLoading, data.availableRoutes, data.selectedRouteId]);

    const handleSubmit = async () => {
        const validation = validateAllSchedules();

        if (!validation.valid) {
            // Show validation errors with schedule information
            const errorMessages = validation.scheduleErrors.flatMap((scheduleError, idx) =>
                scheduleError.errors.map(error => `Schedule ${idx + 1} (${schedules[idx]?.name || 'Unnamed'}): ${error}`)
            );

            toast({
                title: `Validation Failed (${validation.invalidCount} of ${schedules.length} schedules have errors)`,
                description: (
                    <ul className="list-disc pl-4 mt-2 max-h-48 overflow-y-auto">
                        {errorMessages.slice(0, 10).map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                        ))}
                        {errorMessages.length > 10 && (
                            <li className="text-sm text-muted-foreground">...and {errorMessages.length - 10} more errors</li>
                        )}
                    </ul>
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

    return (
            <div className="min-h-screen bg-slate-50">
                {/* Tab Bar */}
                <div className="flex bg-white border-b border-slate-200 px-4 py-2 sticky top-20 z-10 justify-between items-center shadow-sm">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('form')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'form'
                                ? 'bg-blue-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Form Mode
                        </button>
                        <button
                            onClick={() => setActiveTab('textual')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'textual'
                                ? 'bg-blue-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Textual Mode
                        </button>
                        <button
                            onClick={() => setActiveTab('ai-studio')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'ai-studio'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'text-violet-600 hover:text-violet-800 hover:bg-violet-50'
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Studio
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 rounded-lg border border-slate-200"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2 text-sm font-medium text-white transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                            Submit
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {activeTab === 'form' && <ScheduleFormMode />}
                    {activeTab === 'textual' && <ScheduleTextualMode />}
                    {activeTab === 'ai-studio' && <ScheduleAIStudio />}
                </div>
            </div>
    );
}

export default function ScheduleWorkspacePage() {
    return (
        <ScheduleWorkspaceProvider>
            <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
                <ScheduleWorkspaceContent />
            </Suspense>
            <Toaster />
        </ScheduleWorkspaceProvider>
    );
}
