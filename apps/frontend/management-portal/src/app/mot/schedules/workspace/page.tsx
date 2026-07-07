'use client';

import { Suspense } from 'react';
import { Toaster } from '@busmate/ui';
import ScheduleFormMode from '@/components/mot/schedules/workspace/form-mode/ScheduleFormMode';
import ScheduleTextualMode from '@/components/mot/schedules/workspace/textual-mode/ScheduleTextualMode';
import { ScheduleAIStudio } from '@/components/mot/schedules/workspace/ai-studio';
import { ScheduleWorkspaceProvider } from '@/context/ScheduleWorkspace';
import ScheduleWorkspaceTabBar from '@/components/mot/schedules/workspace/ScheduleWorkspaceTabBar';
import { useScheduleWorkspacePage } from '@/hooks/mot/schedules/workspace/useScheduleWorkspacePage';

function ScheduleWorkspaceContent() {
    const { activeTab, setActiveTab, handleSubmit, handleReset } = useScheduleWorkspacePage();

    return (
        <div className="min-h-screen bg-muted">
            <ScheduleWorkspaceTabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onSubmit={handleSubmit}
                onReset={handleReset}
            />
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
            <Suspense fallback={<div className="min-h-screen bg-muted flex items-center justify-center">Loading...</div>}>
                <ScheduleWorkspaceContent />
            </Suspense>
            <Toaster />
        </ScheduleWorkspaceProvider>
    );
}
