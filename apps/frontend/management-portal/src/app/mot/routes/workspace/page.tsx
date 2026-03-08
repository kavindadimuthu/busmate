'use client';

import { useEffect, Suspense, useRef, useState, useCallback } from 'react';
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
import { ErrorBoundary, WorkspaceErrorFallback } from '@/components/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRouteValidation } from '@/hooks/useRouteValidation';
import {
    Loader2,
    Sparkles,
    FileText,
    FormInput,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    RotateCcw,
    Save,
    ChevronRight,
    ArrowUpCircle,
} from 'lucide-react';

// ─── Validation Summary Panel ───────────────────────────────────────────────

function ValidationSummaryPanel() {
    const { data } = useRouteWorkspace();
    const validation = useRouteValidation(data);
    const [isExpanded, setIsExpanded] = useState(false);

    const statusIcon = (status: string) => {
        switch (status) {
            case 'ok':
                return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
            case 'error':
                return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
            case 'empty':
                return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />;
            default:
                return null;
        }
    };

    return (
        <div className="border-l border-slate-200 bg-white">
            {/* Compact summary bar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Progress value={validation.completionPercent} className="h-1.5 w-16" />
                    <span className="text-xs text-slate-500">{validation.completionPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {validation.errorCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                            {validation.errorCount}
                        </Badge>
                    )}
                    {validation.warningCount > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-5">
                            {validation.warningCount}
                        </Badge>
                    )}
                    {validation.errorCount === 0 && validation.warningCount === 0 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* Expanded detail */}
            {isExpanded && (
                <div className="absolute right-4 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 w-72 py-3 px-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Readiness</h4>

                    {/* Section statuses */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {statusIcon(validation.sections.routeGroup.status)}
                            <span className="text-xs text-slate-700">Route Group</span>
                            <span className="text-xs text-slate-400 ml-auto truncate max-w-[120px]">{validation.sections.routeGroup.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {statusIcon(validation.sections.outbound.status)}
                            <span className="text-xs text-slate-700">Outbound</span>
                            <span className="text-xs text-slate-400 ml-auto">{validation.sections.outbound.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {statusIcon(validation.sections.inbound.status)}
                            <span className="text-xs text-slate-700">Inbound</span>
                            <span className="text-xs text-slate-400 ml-auto">{validation.sections.inbound.label}</span>
                        </div>
                    </div>

                    {/* Issue list */}
                    {validation.issues.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issues</h4>
                            {validation.issues.map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                    {issue.severity === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />}
                                    {issue.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                                    {issue.severity === 'info' && <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />}
                                    <span className="text-slate-600">{issue.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Draft Recovery Banner ──────────────────────────────────────────────────

function DraftRecoveryBanner({
    timestamp,
    onRestore,
    onDiscard,
}: {
    timestamp: string;
    onRestore: () => void;
    onDiscard: () => void;
}) {
    const formattedTime = new Date(timestamp).toLocaleString();

    return (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-800">
                    You have unsaved changes from <strong>{formattedTime}</strong>
                </p>
            </div>
            <Button size="sm" variant="outline" onClick={onDiscard} className="text-xs h-7">
                Discard
            </Button>
            <Button size="sm" onClick={onRestore} className="text-xs h-7">
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
            </Button>
        </div>
    );
}

// ─── Main Workspace Content ─────────────────────────────────────────────────

function RouteWorkspaceContent() {
    const [activeTab, setActiveTab] = useState<'form' | 'textual' | 'ai-studio'>('form');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, getRouteGroupData, mode, isLoading, loadError, loadRouteGroup, routeGroupId } = useRouteWorkspace();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const validation = useRouteValidation(data);

    // Auto-save
    const autoSave = useAutoSave(data, mode, routeGroupId);
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    const attemptedLoadIdRef = useRef<string | null>(null);
    const lastErrorRef = useRef<string | null>(null);

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
    }, true);

    // Show draft recovery banner if draft exists
    useEffect(() => {
        if (autoSave.hasDraft) {
            setShowDraftBanner(true);
        }
    }, [autoSave.hasDraft]);

    // Load route group if ID is in URL params
    useEffect(() => {
        const routeGroupIdParam = searchParams.get('routeGroupId');
        if (routeGroupIdParam && !routeGroupId) {
            attemptedLoadIdRef.current = routeGroupIdParam;
            loadRouteGroup(routeGroupIdParam);
        }
    }, [searchParams, loadRouteGroup, routeGroupId]);

    // Show error toast only when loadError changes
    useEffect(() => {
        if (loadError && loadError !== lastErrorRef.current) {
            lastErrorRef.current = loadError;
            toast({
                title: 'Error',
                description: loadError,
                variant: 'destructive',
            });
        }
    }, [loadError, toast]);

    const handleSubmit = () => {
        if (!validation.canSubmit) {
            toast({
                title: 'Cannot Submit',
                description: `Please fix ${validation.errorCount} error(s) before submitting.`,
                variant: 'destructive',
            });
            return;
        }
        setIsModalOpen(true);
    };

    const handleRestoreDraft = useCallback(() => {
        const draftData = autoSave.restoreDraft();
        if (draftData) {
            toast({
                title: 'Draft Restored',
                description: 'Your previous work has been restored.',
            });
            setShowDraftBanner(false);
            window.location.reload();
        }
    }, [autoSave, toast]);

    const handleDiscardDraft = useCallback(() => {
        autoSave.discardDraft();
        setShowDraftBanner(false);
    }, [autoSave]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-slate-500 text-sm">Loading route group data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Failed to load route group</h3>
                        <p className="text-sm text-slate-500 mt-1">{loadError}</p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/mot/routes/workspace">Create a new route group instead</a>
                    </Button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'form' as const, label: 'Form Mode', icon: FormInput },
        { id: 'textual' as const, label: 'Textual Mode', icon: FileText },
        { id: 'ai-studio' as const, label: 'AI Studio', icon: Sparkles },
    ];

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Draft Recovery Banner */}
                {showDraftBanner && autoSave.draftTimestamp && (
                    <DraftRecoveryBanner
                        timestamp={autoSave.draftTimestamp}
                        onRestore={handleRestoreDraft}
                        onDiscard={handleDiscardDraft}
                    />
                )}

                {/* Top Bar: Navigation + Actions */}
                <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2 relative">
                        {/* Left: Tab Navigation */}
                        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg" role="tablist">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                const isAI = tab.id === 'ai-studio';
                                return (
                                    <button
                                        key={tab.id}
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200
                                            ${isActive
                                                ? isAI
                                                    ? 'bg-violet-600 text-white shadow-sm'
                                                    : 'bg-blue-600 text-white shadow-sm'
                                                : isAI
                                                    ? 'text-violet-600 hover:text-violet-800 hover:bg-violet-50'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right: Validation + Submit */}
                        <div className="flex items-center gap-3">
                            <ValidationSummaryPanel />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!validation.canSubmit}
                                            className={`transition-all duration-200 ${mode === 'edit'
                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                            }`}
                                            size="sm"
                                        >
                                            {mode === 'edit' ? (
                                                <>
                                                    <ArrowUpCircle className="h-4 w-4 mr-1.5" />
                                                    Update
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-1.5" />
                                                    Submit
                                                </>
                                            )}
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!validation.canSubmit && (
                                    <TooltipContent>
                                        <p>Fix {validation.errorCount} error(s) to enable submission</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
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
                <Suspense fallback={
                    <div className="flex flex-col h-96 justify-center items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-slate-500 text-sm">Loading routes workspace...</p>
                    </div>
                }>
                    <RouteWorkspaceContent />
                </Suspense>
                <Toaster />
            </RouteWorkspaceProvider>
        </ErrorBoundary>
    );
}