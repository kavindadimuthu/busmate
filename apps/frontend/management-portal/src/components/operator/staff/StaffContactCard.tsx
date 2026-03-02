'use client';

import { Phone, Mail, MapPin, User, Users, Calendar } from 'lucide-react';
import type { StaffMember } from '@/data/operator/staff';

interface StaffContactCardProps {
  staff: StaffMember;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function StaffContactCard({ staff }: StaffContactCardProps) {
  const dob = new Date(staff.dateOfBirth);
  const age = new Date().getFullYear() - dob.getFullYear();
  const genderLabel = staff.gender === 'MALE' ? 'Male' : staff.gender === 'FEMALE' ? 'Female' : 'Other';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <User className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-900">Contact & Personal Information</h2>
      </div>

      <div className="p-5 space-y-4">
        <InfoRow icon={<Phone className="w-4 h-4" />}  label="Phone Number"  value={staff.phone} />
        <InfoRow icon={<Mail className="w-4 h-4" />}   label="Email Address"  value={staff.email} />
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Address"
          value={`${staff.address}, ${staff.city}, ${staff.province} Province`}
        />
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Date of Birth"
          value={`${dob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (Age ${age})`}
        />
        <InfoRow icon={<User className="w-4 h-4" />}  label="Gender"         value={genderLabel} />
        <InfoRow icon={<User className="w-4 h-4" />}  label="NIC Number"     value={staff.nic} />

        {/* Emergency contact */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Emergency Contact</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-gray-900">{staff.emergencyContact.name}</p>
            <p className="text-xs text-gray-600">{staff.emergencyContact.relationship}</p>
            <p className="text-sm text-gray-700">{staff.emergencyContact.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
