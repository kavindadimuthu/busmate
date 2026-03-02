'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RouteFormMode from '@/components/mot/routes/workspace/form-mode/RouteFormMode';
import RouteTextualMode from '@/components/mot/routes/workspace/textual-mode/RouteTextualMode';
import RouteAIStudio from '@/components/mot/routes/workspace/ai-studio/RouteAIStudio';
import { useSetPageMetadata } from '@/context/PageContext';
import { RouteWorkspaceProvider } from '@/context/RouteWorkspace/RouteWorkspaceProvider';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import RouteSubmissionModal from '@/components/mot/routes/workspace/RouteSubmissionModal';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

function RouteWorkspaceContent() {
    const [activeTab, setActiveTab] = useState<'form' | 'textual' | 'ai-studio'>('form');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { getRouteGroupData, mode, isLoading, loadError, loadRouteGroup, routeGroupId } = useRouteWorkspace();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const pageTitle = mode === 'edit' ? 'Edit Route Group' : 'Create Route Group';
    const pageDescription = mode === 'edit'
        ? 'Update an existing route group and its routes'
        : 'Create a new bus route group with routes';

    useSetPageMetadata({
        title: pageTitle,
        description: pageDescription,
        activeItem: 'routes',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: 'Workspace' }],
        padding: 0,
    });

    // Load route group if ID is in URL params
    useEffect(() => {
        const routeGroupIdParam = searchParams.get('routeGroupId');
        if (routeGroupIdParam && !routeGroupId) {
            loadRouteGroup(routeGroupIdParam).then((success) => {
                if (!success) {
                    toast({
                        title: 'Error',
                        description: 'Failed to load route group for editing',
                        variant: 'destructive',
                    });
                }
            });
        }
    }, [searchParams, loadRouteGroup, routeGroupId, toast]);

    const handleSubmit = () => {
        const routeGroupData = getRouteGroupData();
        setIsModalOpen(true);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading route group data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (loadError) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="text-red-600 text-lg font-semibold">Failed to load route group</div>
                    <p className="text-gray-600">{loadError}</p>
                    <a
                        href="/mot/routes/workspace"
                        className="text-blue-600 hover:underline"
                    >
                        Create a new route group instead
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
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
                    <button
                        onClick={handleSubmit}
                        className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 shadow-sm ${mode === 'edit'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                    >
                        {mode === 'edit' ? 'Update' : 'Submit'}
                    </button>
                </div>
                <div className="p-4">
                    {activeTab === 'form' && <RouteFormMode />}
                    {activeTab === 'textual' && <RouteTextualMode />}
                    {activeTab === 'ai-studio' && <RouteAIStudio />}
                </div>
            </div>
            <RouteSubmissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}

export default function RoutesWorkspacePage() {
    return (
        <RouteWorkspaceProvider>
            <Suspense fallback={
                <div className="flex flex-col h-96 justify-center items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading routes workspace...</p>
                </div>
            }>
                <RouteWorkspaceContent />
            </Suspense>
            <Toaster />
        </RouteWorkspaceProvider>
    );
}