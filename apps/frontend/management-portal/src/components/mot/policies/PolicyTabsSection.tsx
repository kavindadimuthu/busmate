'use client';

import { useState } from 'react';
import { FileText, BookOpen, Paperclip, History, ExternalLink, Download } from 'lucide-react';
import { Policy } from '@/data/mot/policies';

interface PolicyTabsSectionProps {
    policy: Policy;
}

type TabId = 'overview' | 'content' | 'documents' | 'history';

interface Tab {
    id: TabId;
    label: string;
    icon: typeof FileText;
}

const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'content', label: 'Full Content', icon: BookOpen },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'history', label: 'Version History', icon: History },
];

export function PolicyTabsSection({ policy }: PolicyTabsSectionProps) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // Mock version history
    const versionHistory = [
        {
            version: policy.version,
            date: policy.lastModified,
            author: policy.author,
            changes: 'Current version',
            status: 'Current',
        },
        {
            version: 'v' + (parseFloat(policy.version.replace('v', '')) - 0.1).toFixed(1),
            date: policy.createdAt,
            author: policy.author,
            changes: 'Initial release',
            status: 'Previous',
        },
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed">{policy.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Information</h4>
                                <dl className="space-y-2.5">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Policy ID</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.id}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Version</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.version}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Type</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.type}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Category</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.category}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Priority</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.priority}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                                <dl className="space-y-2.5">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Created</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.createdAt}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Published</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.publishedDate}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Effective From</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.effectiveDate}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Expires</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.expiryDate || 'No expiry'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Last Modified</dt>
                                        <dd className="text-sm font-medium text-gray-900">{policy.lastModified}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                    <div className="prose prose-sm max-w-none">
                        {policy.content.split('\n').map((line, index) => {
                            if (line.startsWith('# ')) {
                                return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>;
                            }
                            if (line.startsWith('## ')) {
                                return <h2 key={index} className="text-xl font-semibold text-gray-800 mt-5 mb-2">{line.slice(3)}</h2>;
                            }
                            if (line.startsWith('### ')) {
                                return <h3 key={index} className="text-lg font-medium text-gray-700 mt-4 mb-2">{line.slice(4)}</h3>;
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return <p key={index} className="font-semibold text-gray-800 my-2">{line.slice(2, -2)}</p>;
                            }
                            if (line.startsWith('- ')) {
                                return (
                                    <li key={index} className="text-gray-600 ml-4 list-disc my-1">
                                        {line.slice(2)}
                                    </li>
                                );
                            }
                            if (line.match(/^\d+\.\s/)) {
                                return (
                                    <li key={index} className="text-gray-600 ml-4 list-decimal my-1">
                                        {line.replace(/^\d+\.\s/, '')}
                                    </li>
                                );
                            }
                            if (line.trim() === '') {
                                return <div key={index} className="h-2" />;
                            }
                            return <p key={index} className="text-gray-600 my-1">{line}</p>;
                        })}
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        {policy.documentUrl ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Policy Document</p>
                                        <p className="text-xs text-gray-500 truncate max-w-md">{policy.documentUrl}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={policy.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open
                                    </a>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No documents attached to this policy</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Version History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {versionHistory.map((entry, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-4 p-4 rounded-lg border ${entry.status === 'Current'
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.status === 'Current'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    <History className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-medium text-gray-900">{entry.version}</span>
                                        {entry.status === 'Current' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{entry.changes}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {entry.author} · {entry.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
