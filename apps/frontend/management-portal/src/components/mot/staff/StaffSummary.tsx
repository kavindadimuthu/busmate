'use client';

import React from 'react';
import {
    User,
    Phone,
    Mail,
    IdCard,
    MapPin,
    Clock,
    Search,
    CheckCircle,
    XCircle,
    Building,
    Calendar,
} from 'lucide-react';
import type { StaffMember } from '@/data/mot/staff';

interface StaffSummaryProps {
    staff: StaffMember;
}

export function StaffSummary({ staff }: StaffSummaryProps) {
    const getStaffTypeConfig = (type: string) => {
        switch (type) {
            case 'timekeeper':
                return {
                    icon: Clock,
                    label: 'Timekeeper',
                    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                    iconColor: 'text-indigo-600',
                };
            case 'inspector':
                return {
                    icon: Search,
                    label: 'Inspector',
                    color: 'bg-purple-100 text-purple-700 border-purple-200',
                    iconColor: 'text-purple-600',
                };
            default:
                return {
                    icon: User,
                    label: type,
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    iconColor: 'text-gray-600',
                };
        }
    };

    const typeConfig = getStaffTypeConfig(staff.staffType);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('en-LK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                        {staff.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-bold text-white">{staff.fullName}</h2>
                        <p className="text-blue-100 mt-1">{staff.email || 'No email provided'}</p>
                        <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start">
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${typeConfig.color}`}
                            >
                                <typeConfig.icon className="w-3.5 h-3.5" />
                                {typeConfig.label}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${staff.status === 'active'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                                    }`}
                            >
                                {staff.status === 'active' ? (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                )}
                                {staff.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoField label="Full Name" icon={<User className="w-5 h-5" />} value={staff.fullName} />
                    <InfoField label="Phone Number" icon={<Phone className="w-5 h-5" />} value={staff.phone} />
                    <InfoField label="Email" icon={<Mail className="w-5 h-5" />} value={staff.email} />
                    <InfoField label="NIC" icon={<IdCard className="w-5 h-5" />} value={staff.nic} />
                    <InfoField label="Province" icon={<MapPin className="w-5 h-5" />} value={staff.province} />
                    <InfoField label="Assigned Location" icon={<Building className="w-5 h-5" />} value={staff.assignedLocation} />
                    <InfoField label="Joined Date" icon={<Calendar className="w-5 h-5" />} value={formatDate(staff.createdAt)} />
                    <InfoField label="Last Updated" icon={<Calendar className="w-5 h-5" />} value={formatDate(staff.updatedAt)} />
                </div>
            </div>
        </div>
    );
}

function InfoField({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number | React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="shrink-0 text-blue-500 mt-0.5">{icon}</div>
            <div>
                <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    {label}
                </h4>
                <p className="text-gray-800 text-sm font-medium mt-0.5">
                    {value || <span className="text-gray-400">—</span>}
                </p>
            </div>
        </div>
    );
}
