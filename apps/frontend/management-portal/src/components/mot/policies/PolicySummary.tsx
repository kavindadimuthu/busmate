'use client';

import {
    Calendar,
    User,
    Building2,
    Tag,
    FileText,
    Clock,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react';
import { Policy } from '@/data/mot/policies';

interface PolicySummaryProps {
    policy: Policy;
}

export function PolicySummary({ policy }: PolicySummaryProps) {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'published':
                return 'bg-success/15 text-success border-success/30';
            case 'draft':
                return 'bg-warning/15 text-warning border-warning/30';
            case 'under review':
                return 'bg-primary/15 text-primary border-primary/30';
            case 'archived':
                return 'bg-muted text-foreground border-border';
            default:
                return 'bg-muted text-foreground border-border';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'bg-destructive/15 text-destructive border-destructive/30';
            case 'medium':
                return 'bg-warning/15 text-orange-700 border-orange-300';
            case 'low':
                return 'bg-muted text-muted-foreground border-border';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="bg-card rounded-lg border border-border shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{policy.title}</h2>
                                <p className="text-sm text-muted-foreground">{policy.id} · {policy.version}</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-3">{policy.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(policy.status)}`}>
                            {policy.status}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(policy.priority)}`}>
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            {policy.priority}
                        </span>
                    </div>
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Author</p>
                            <p className="text-sm text-foreground">{policy.author}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Department</p>
                            <p className="text-sm text-foreground">{policy.department}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                            <p className="text-sm text-foreground">{policy.effectiveDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                            <p className="text-sm text-foreground">{policy.expiryDate || 'No expiry'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Type / Category</p>
                            <p className="text-sm text-foreground">{policy.type} · {policy.category}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Published Date</p>
                            <p className="text-sm text-foreground">{policy.publishedDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                            <p className="text-sm text-foreground">{policy.lastModified}</p>
                        </div>
                    </div>

                    {policy.documentUrl && (
                        <div className="flex items-start gap-3">
                            <ExternalLink className="w-5 h-5 text-muted-foreground/70 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Document</p>
                                <a
                                    href={policy.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:text-primary underline"
                                >
                                    View Document
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {policy.tags.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {policy.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
