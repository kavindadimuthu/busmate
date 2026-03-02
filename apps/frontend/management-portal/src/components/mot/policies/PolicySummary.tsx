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
                return 'bg-green-100 text-green-800 border-green-300';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'under review':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'archived':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'medium':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'low':
                return 'bg-gray-100 text-gray-600 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-300';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{policy.title}</h2>
                                <p className="text-sm text-gray-500">{policy.id} · {policy.version}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mt-3">{policy.description}</p>
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
                        <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Author</p>
                            <p className="text-sm text-gray-900">{policy.author}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Department</p>
                            <p className="text-sm text-gray-900">{policy.department}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Effective Date</p>
                            <p className="text-sm text-gray-900">{policy.effectiveDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                            <p className="text-sm text-gray-900">{policy.expiryDate || 'No expiry'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Type / Category</p>
                            <p className="text-sm text-gray-900">{policy.type} · {policy.category}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Published Date</p>
                            <p className="text-sm text-gray-900">{policy.publishedDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Last Modified</p>
                            <p className="text-sm text-gray-900">{policy.lastModified}</p>
                        </div>
                    </div>

                    {policy.documentUrl && (
                        <div className="flex items-start gap-3">
                            <ExternalLink className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Document</p>
                                <a
                                    href={policy.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    View Document
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {policy.tags.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {policy.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
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
