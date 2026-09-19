'use client';

import React from 'react';
import { CircleDot, Mail, Phone, AtSign, Hash, CreditCard, Calendar } from 'lucide-react';
import type { AdminUser } from '@/data/admin/users';
import { USER_STATUS_CONFIG, formatDateShort } from '@/data/admin/users';
import { UserPhoto } from '@/components/shared/profile/UserPhoto';
import { ProfilePhotoAvatar } from '@/components/shared/profile/ProfilePhotoAvatar';

interface CrewSummaryProps {
  conductor: AdminUser;
  /** The operator may set or replace their conductor's photo (INC-019). */
  photoEditable?: boolean;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

export function CrewSummary({ conductor, photoEditable = false }: CrewSummaryProps) {
  const statusConfig = USER_STATUS_CONFIG[conductor.status];
  const employeeId = (conductor.profileData?.employee_id as string) || '—';
  const nic = (conductor.profileData?.nic_number as string) || '—';

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8">
          <div className="flex items-center gap-5">
            {photoEditable ? (
              <ProfilePhotoAvatar
                userId={conductor.id}
                displayName={conductor.fullName}
                initials={`${conductor.firstName[0]}${conductor.lastName?.[0] ?? ''}`}
                fallbackClassName="bg-card/20 backdrop-blur-sm text-white text-xl font-bold"
              />
            ) : (
              <UserPhoto
                userId={conductor.id}
                name={conductor.fullName}
                className="w-16 h-16 shrink-0 border-2 border-white/30"
                fallbackClassName="bg-card/20 backdrop-blur-sm text-white text-xl font-bold"
                fallback={`${conductor.firstName[0]}${conductor.lastName?.[0] ?? ''}`}
              />
            )}
            <div className="text-white">
              <h2 className="text-xl font-bold">{conductor.fullName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30">
                  <CircleDot className="h-3 w-3" />
                  Conductor
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Contact Information</h3>
          <div>
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={conductor.email} />
            <InfoRow icon={<AtSign className="h-3.5 w-3.5" />} label="Username" value={`@${conductor.username}`} />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={conductor.phone || '—'} />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Employment Details</h3>
          <div>
            <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Employee ID" value={employeeId} />
            <InfoRow icon={<CreditCard className="h-3.5 w-3.5" />} label="NIC Number" value={nic} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={formatDateShort(conductor.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
