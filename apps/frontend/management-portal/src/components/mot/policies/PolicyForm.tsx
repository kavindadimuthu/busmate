'use client';

import { useState, useEffect } from 'react';
import { Policy } from '@/data/mot/policies';

interface PolicyFormProps {
    policy?: Policy;
    onSubmit: (data: PolicyFormData) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    submitButtonText?: string;
    mode: 'create' | 'edit';
}

export interface PolicyFormData {
    title: string;
    type: string;
    category: string;
    description: string;
    content: string;
    status: string;
    version: string;
    author: string;
    department: string;
    effectiveDate: string;
    expiryDate: string;
    priority: string;
    tags: string;
    documentUrl: string;
}

const policyTypes = [
    'Operational', 'Safety', 'Licensing', 'Environmental', 'Financial',
    'Service', 'Legal', 'HR', 'Technical',
];

const policyCategories = [
    'Operations', 'Compliance', 'Human Resources', 'Finance',
    'Customer Service', 'Legal & Governance', 'IT & Technology',
];

const departments = [
    'Operations Division', 'Safety & Compliance', 'Human Resources',
    'Finance', 'Customer Relations', 'Legal & Governance',
    'IT & Technology', 'Environmental Affairs',
];

const priorities = ['High', 'Medium', 'Low'];
const statuses = ['Draft', 'Under Review', 'Published', 'Archived'];

export function PolicyForm({
    policy,
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitButtonText = 'Submit',
    mode,
}: PolicyFormProps) {
    const [formData, setFormData] = useState<PolicyFormData>({
        title: '',
        type: '',
        category: '',
        description: '',
        content: '',
        status: 'Draft',
        version: 'v1.0',
        author: '',
        department: '',
        effectiveDate: '',
        expiryDate: '',
        priority: 'Medium',
        tags: '',
        documentUrl: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof PolicyFormData, string>>>({});

    // Pre-fill form for edit mode
    useEffect(() => {
        if (mode === 'edit' && policy) {
            setFormData({
                title: policy.title,
                type: policy.type,
                category: policy.category,
                description: policy.description,
                content: policy.content,
                status: policy.status,
                version: policy.version,
                author: policy.author,
                department: policy.department,
                effectiveDate: policy.effectiveDate,
                expiryDate: policy.expiryDate || '',
                priority: policy.priority,
                tags: policy.tags.join(', '),
                documentUrl: policy.documentUrl || '',
            });
        }
    }, [mode, policy]);

    const handleChange = (field: keyof PolicyFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error on change
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof PolicyFormData, string>> = {};
        if (!formData.title.trim()) newErrors.title = 'Policy title is required';
        if (!formData.type) newErrors.type = 'Policy type is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.author.trim()) newErrors.author = 'Author is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Title - full width */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Policy Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter policy title"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Policy Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.type ? 'border-red-300' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select type</option>
                            {policyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select category</option>
                            {policyCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Description - full width */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of this policy"
                            rows={3}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>
                </div>
            </div>

            {/* Policy Content */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Content</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Content (Markdown supported)
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="Enter policy content in markdown format..."
                        rows={12}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                </div>
            </div>

            {/* Metadata */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Author <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => handleChange('author', e.target.value)}
                            placeholder="e.g. Transport Authority"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.author ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Department <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.department}
                            onChange={(e) => handleChange('department', e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department ? 'border-red-300' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select department</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                    </div>

                    {/* Version */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Version</label>
                        <input
                            type="text"
                            value={formData.version}
                            onChange={(e) => handleChange('version', e.target.value)}
                            placeholder="e.g. v1.0"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => handleChange('priority', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Effective Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Effective Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.effectiveDate}
                            onChange={(e) => handleChange('effectiveDate', e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.effectiveDate ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        {errors.effectiveDate && <p className="text-xs text-red-500 mt-1">{errors.effectiveDate}</p>}
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                        <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => handleChange('expiryDate', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            placeholder="Comma-separated tags"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Document URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Document URL</label>
                        <input
                            type="url"
                            value={formData.documentUrl}
                            onChange={(e) => handleChange('documentUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                {mode === 'create' && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => handleChange('status', 'Draft')}
                        className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        Save as Draft
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    )}
                    {submitButtonText}
                </button>
            </div>
        </form>
    );
}
