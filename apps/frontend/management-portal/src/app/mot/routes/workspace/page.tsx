'use client';

import { Suspense } from 'react';
import RouteFormMode from '@/components/mot/routes/workspace/form-mode/RouteFormMode';
import RouteTextualMode from '@/components/mot/routes/workspace/textual-mode/RouteTextualMode';
import RouteAIStudio from '@/components/mot/routes/workspace/ai-studio/RouteAIStudio';
import { RouteWorkspaceProvider } from '@/context/RouteWorkspace/RouteWorkspaceProvider';
import { Toaster, Button, TooltipProvider } from '@busmate/ui';
import RouteSubmissionModal from '@/components/mot/routes/workspace/RouteSubmissionModal';
import DraftRecoveryBanner from '@/components/mot/routes/workspace/DraftRecoveryBanner';
import WorkspaceTopBar from '@/components/mot/routes/workspace/WorkspaceTopBar';
import { ErrorBoundary, WorkspaceErrorFallback } from '@/components/shared/ErrorBoundary';
import { useRouteWorkspacePage } from '@/hooks/useRouteWorkspacePage';
import { Loader2, AlertCircle } from 'lucide-react';

function LoadingSpinner({ message }: { message: string }) {
    return (
        <div className="flex flex-col h-96 justify-center items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}

function RouteWorkspaceContent() {
    const {
        activeTab, setActiveTab, isModalOpen, setIsModalOpen,
        mode, isLoading, loadError, validation,
        autoSave, showDraftBanner,
        handleSubmit, handleRestoreDraft, handleDiscardDraft,
    } = useRouteWorkspacePage();

    if (isLoading) return <LoadingSpinner message="Loading route group data..." />;

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">Failed to load route group</h3>
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button variant="outline" asChild>
                        <a href="/mot/routes/workspace">Create a new route group instead</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-muted flex flex-col">
                {showDraftBanner && autoSave.draftTimestamp && (
                    <DraftRecoveryBanner
                        timestamp={autoSave.draftTimestamp}
                        onRestore={handleRestoreDraft}
                        onDiscard={handleDiscardDraft}
                    />
                )}

                <WorkspaceTopBar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    mode={mode}
                    validation={validation}
                    onSubmit={handleSubmit}
                />

                <div className="flex-1 p-4">
                    {activeTab === 'form' && <RouteFormMode />}
                    {activeTab === 'textual' && <RouteTextualMode />}
                    {activeTab === 'ai-studio' && <RouteAIStudio />}
                </div>
            </div>

            <RouteSubmissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </TooltipProvider>
    );
}

export default function RoutesWorkspacePage() {
    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <WorkspaceErrorFallback error={error} onReset={reset} />
            )}
        >
            <RouteWorkspaceProvider>
                <Suspense fallback={<LoadingSpinner message="Loading routes workspace..." />}>
                    <RouteWorkspaceContent />
                </Suspense>
                <Toaster />
            </RouteWorkspaceProvider>
        </ErrorBoundary>
    );
}