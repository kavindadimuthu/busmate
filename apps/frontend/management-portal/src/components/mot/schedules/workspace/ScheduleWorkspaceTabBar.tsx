'use client';

import { Sparkles } from 'lucide-react';
import type { WorkspaceTab } from '../../../../hooks/mot/schedules/workspace/useScheduleWorkspacePage';

interface ScheduleWorkspaceTabBarProps {
    activeTab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
    onSubmit: () => void;
    onReset: () => void;
}

export default function ScheduleWorkspaceTabBar({ activeTab, onTabChange, onSubmit, onReset }: ScheduleWorkspaceTabBarProps) {
    const tabBase = 'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200';
    const activeStyle = 'bg-primary text-white shadow-sm';
    const inactiveStyle = 'text-muted-foreground hover:text-foreground hover:bg-muted';

    return (
        <div className="flex bg-card border-b border-border px-4 py-2 z-10 justify-between items-center shadow-sm">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <button
                    onClick={() => onTabChange('form')}
                    className={`${tabBase} ${activeTab === 'form' ? activeStyle : inactiveStyle}`}
                >
                    Form Mode
                </button>
                <button
                    onClick={() => onTabChange('textual')}
                    className={`${tabBase} ${activeTab === 'textual' ? activeStyle : inactiveStyle}`}
                >
                    Textual Mode
                </button>
                <button
                    onClick={() => onTabChange('ai-studio')}
                    className={`${tabBase} flex items-center gap-1.5 ${activeTab === 'ai-studio'
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
                    onClick={onReset}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted rounded-lg border border-border"
                >
                    Reset
                </button>
                <button
                    onClick={onSubmit}
                    className="px-5 py-2 text-sm font-medium text-white transition-all duration-200 bg-success hover:bg-success rounded-lg shadow-sm"
                >
                    Submit
                </button>
            </div>
        </div>
    );
}
