'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { StaffMember, StaffFormData, StaffType, StaffStatus } from '@/data/mot/staff';
import { getStaffMemberById } from '@/data/mot/staff';

interface StaffFormProps {
    staffId?: string;
    onSuccess: (staff: StaffMember) => void;
    onCancel: () => void;
}

const provinces = [
    'Western',
    'Central',
    'Southern',
    'North Western',
    'Sabaragamuwa',
    'North Central',
    'Uva',
    'Eastern',
    'Northern',
];

const staffTypes: { value: StaffType; label: string }[] = [
    { value: 'timekeeper', label: 'Timekeeper' },
    { value: 'inspector', label: 'Inspector' },
];

const statusOptions: { value: StaffStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function StaffForm({ staffId, onSuccess, onCancel }: StaffFormProps) {
    const isEditMode = Boolean(staffId);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<StaffFormData>({
        fullName: '',
        phone: '',
        email: '',
        nic: '',
        province: '',
        staffType: 'timekeeper',
        assignedLocation: '',
        status: 'active',
    });

    // Load existing staff data for edit mode
    useEffect(() => {
        if (staffId) {
            setIsLoadingData(true);
            // Simulate async load from sample data
            const timer = setTimeout(() => {
                const existing = getStaffMemberById(staffId);
                if (existing) {
                    setFormData({
                        fullName: existing.fullName,
                        phone: existing.phone,
                        email: existing.email,
                        nic: existing.nic,
                        province: existing.province,
                        staffType: existing.staffType,
                        assignedLocation: existing.assignedLocation,
                        status: existing.status,
                    });
                } else {
                    setError('Staff member not found.');
                }
                setIsLoadingData(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [staffId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            const result: StaffMember = {
                id: staffId || `STF${Date.now()}`,
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                nic: formData.nic,
                province: formData.province,
                staffType: formData.staffType,
                assignedLocation: formData.assignedLocation,
                status: formData.status,
                createdAt: staffId ? '' : new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
            };

            onSuccess(result);
        } catch (err) {
            console.error('Error saving staff member:', err);
            setError('Failed to save staff member. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                <div className="flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-4" />
                    <p className="text-gray-600 font-medium">Loading staff member details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5">
                <h2 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                    {isEditMode
                        ? 'Update the staff member information below.'
                        : 'Fill in the details to create a new staff member.'}
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Enter full name"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="e.g. 0771234567"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Email address"
                        />
                    </div>

                    {/* NIC */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            NIC <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nic"
                            value={formData.nic}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="National ID number"
                        />
                    </div>

                    {/* Staff Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Staff Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="staffType"
                            value={formData.staffType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        >
                            {staffTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Province */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Province <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="province"
                            value={formData.province}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        >
                            <option value="">Select province</option>
                            {provinces.map((province) => (
                                <option key={province} value={province}>
                                    {province}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Assigned Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="assignedLocation"
                            value={formData.assignedLocation}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Bus stand or terminal name"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        >
                            {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Update Staff Member' : 'Create Staff Member'}
                    </button>
                </div>
            </form>
        </div>
    );
}
