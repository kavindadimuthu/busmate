'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { useToast } from '@/hooks/use-toast';
import { useSetPageMetadata } from '@/context/PageContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRouteValidation } from '@/hooks/useRouteValidation';

export function useRouteWorkspacePage() {
    const [activeTab, setActiveTab] = useState<'form' | 'textual' | 'ai-studio'>('form');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, mode, isLoading, loadError, loadRouteGroup, routeGroupId } = useRouteWorkspace();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const validation = useRouteValidation(data);

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

    const handleSubmit = useCallback(() => {
        if (!validation.canSubmit) {
            toast({
                title: 'Cannot Submit',
                description: `Please fix ${validation.errorCount} error(s) before submitting.`,
                variant: 'destructive',
            });
            return;
        }
        setIsModalOpen(true);
    }, [validation, toast]);

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

    return {
        activeTab,
        setActiveTab,
        isModalOpen,
        setIsModalOpen,
        mode,
        isLoading,
        loadError,
        validation,
        autoSave,
        showDraftBanner,
        handleSubmit,
        handleRestoreDraft,
        handleDiscardDraft,
    };
}
