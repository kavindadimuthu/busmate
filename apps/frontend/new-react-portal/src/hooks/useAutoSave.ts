'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { RouteWorkspaceData } from '@/types/RouteWorkspaceData';

const STORAGE_KEY = 'busmate-route-workspace-draft';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

interface DraftData {
  data: RouteWorkspaceData;
  savedAt: string;
  mode: 'create' | 'edit';
  routeGroupId?: string | null;
}

interface UseAutoSaveReturn {
  hasDraft: boolean;
  draftTimestamp: string | null;
  restoreDraft: () => RouteWorkspaceData | null;
  discardDraft: () => void;
  saveDraft: () => void;
}

export function useAutoSave(
  data: RouteWorkspaceData,
  mode: 'create' | 'edit',
  routeGroupId: string | null
): UseAutoSaveReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft: DraftData = JSON.parse(stored);
        // Only show recovery if it matches the current context (or is a create draft)
        if (
          (draft.mode === 'create' && mode === 'create') ||
          (draft.mode === 'edit' && draft.routeGroupId === routeGroupId)
        ) {
          setHasDraft(true);
          setDraftTimestamp(draft.savedAt);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []); // Only run once on mount

  const saveDraft = useCallback(() => {
    try {
      const draft: DraftData = {
        data: dataRef.current,
        savedAt: new Date().toISOString(),
        mode,
        routeGroupId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [mode, routeGroupId]);

  const restoreDraft = useCallback((): RouteWorkspaceData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft: DraftData = JSON.parse(stored);
        setHasDraft(false);
        setDraftTimestamp(null);
        return draft.data;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setHasDraft(false);
    setDraftTimestamp(null);
  }, []);

  // Set up auto-save interval
  useEffect(() => {
    timerRef.current = setInterval(() => {
      saveDraft();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [saveDraft]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveDraft]);

  return {
    hasDraft,
    draftTimestamp,
    restoreDraft,
    discardDraft,
    saveDraft,
  };
}
