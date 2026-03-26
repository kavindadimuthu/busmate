'use client';

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@busmate/ui';
import { RouteValidationSummary } from '@/hooks/useRouteValidation';
import ValidationSummaryPanel from './ValidationSummaryPanel';
import { Sparkles, FileText, FormInput, ArrowUpCircle, Save } from 'lucide-react';

type TabId = 'form' | 'textual' | 'ai-studio';

const tabs: { id: TabId; label: string; icon: typeof FormInput }[] = [
    { id: 'form', label: 'Form Mode', icon: FormInput },
    { id: 'textual', label: 'Textual Mode', icon: FileText },
    { id: 'ai-studio', label: 'AI Studio', icon: Sparkles },
];

interface WorkspaceTopBarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    mode: 'create' | 'edit';
    validation: RouteValidationSummary;
    onSubmit: () => void;
}

export default function WorkspaceTopBar({ activeTab, onTabChange, mode, validation, onSubmit }: WorkspaceTopBarProps) {
    return (
        <div className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 relative">
                {/* Left: Tab Navigation */}
                <nav className="flex items-center gap-1 bg-muted p-1 rounded-lg" role="tablist">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isAI = tab.id === 'ai-studio';
                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200
                                    ${isActive
                                        ? isAI
                                            ? 'bg-violet-600 text-white shadow-sm'
                                            : 'bg-primary text-white shadow-sm'
                                        : isAI
                                            ? 'text-violet-600 hover:text-violet-800 hover:bg-violet-50'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-card'
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
                                    onClick={onSubmit}
                                    disabled={!validation.canSubmit}
                                    className={`transition-all duration-200 ${mode === 'edit'
                                        ? 'bg-warning hover:bg-warning'
                                        : 'bg-success hover:bg-success'
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
    );
}
