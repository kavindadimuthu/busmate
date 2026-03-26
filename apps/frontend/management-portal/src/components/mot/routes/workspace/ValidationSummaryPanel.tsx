'use client';

import { useState } from 'react';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { useRouteValidation } from '@/hooks/useRouteValidation';
import { Badge, Progress } from '@busmate/ui';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronRight,
} from 'lucide-react';

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'ok':
            return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
        case 'error':
            return <AlertCircle className="h-3.5 w-3.5 text-destructive/80" />;
        case 'warning':
            return <AlertTriangle className="h-3.5 w-3.5 text-warning/80" />;
        case 'empty':
            return <div className="h-3.5 w-3.5 rounded-full border-2 border-border" />;
        default:
            return null;
    }
}

export default function ValidationSummaryPanel() {
    const { data } = useRouteWorkspace();
    const validation = useRouteValidation(data);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border-l border-border bg-card">
            {/* Compact summary bar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Progress value={validation.completionPercent} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground">{validation.completionPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {validation.errorCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                            {validation.errorCount}
                        </Badge>
                    )}
                    {validation.warningCount > 0 && (
                        <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px] px-1.5 py-0 h-5">
                            {validation.warningCount}
                        </Badge>
                    )}
                    {validation.errorCount === 0 && validation.warningCount === 0 && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* Expanded detail */}
            {isExpanded && (
                <div className="absolute right-4 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-30 w-72 py-3 px-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Readiness</h4>

                    {/* Section statuses */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <StatusIcon status={validation.sections.routeGroup.status} />
                            <span className="text-xs text-muted-foreground">Route Group</span>
                            <span className="text-xs text-muted-foreground/70 ml-auto truncate max-w-[120px]">{validation.sections.routeGroup.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusIcon status={validation.sections.outbound.status} />
                            <span className="text-xs text-muted-foreground">Outbound</span>
                            <span className="text-xs text-muted-foreground/70 ml-auto">{validation.sections.outbound.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusIcon status={validation.sections.inbound.status} />
                            <span className="text-xs text-muted-foreground">Inbound</span>
                            <span className="text-xs text-muted-foreground/70 ml-auto">{validation.sections.inbound.label}</span>
                        </div>
                    </div>

                    {/* Issue list */}
                    {validation.issues.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/50">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issues</h4>
                            {validation.issues.map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                    {issue.severity === 'error' && <AlertCircle className="h-3 w-3 text-destructive/80 mt-0.5 shrink-0" />}
                                    {issue.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-warning/80 mt-0.5 shrink-0" />}
                                    {issue.severity === 'info' && <Info className="h-3 w-3 text-primary/80 mt-0.5 shrink-0" />}
                                    <span className="text-muted-foreground">{issue.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
