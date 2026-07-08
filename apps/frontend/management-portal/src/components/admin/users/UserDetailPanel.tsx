'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users,
  BadgeCheck,
  BadgeX,
  Copy,
  CheckCircle2,
  Hash,
  AtSign,
  KeyRound,
} from 'lucide-react';
import {
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  getUserDisplayName,
  formatDateShort,
  timeAgo,
  formatProfileFieldLabel,
} from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';
import type { UserPermissionsResponse } from '@/lib/api/adminUsers';

interface UserDetailPanelProps {
  user: AdminUser;
  permissions?: UserPermissionsResponse | null;
  currentUserId?: string | null;
  onBack: () => void;
  onEdit: (userId: string) => void;
  onToggleStatus: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export function UserDetailPanel({
  user,
  permissions,
  currentUserId,
  onBack,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const typeConfig = USER_TYPE_CONFIG[user.userType];
  const statusConfig = USER_STATUS_CONFIG[user.status];
  const displayName = getUserDisplayName(user);
  const isActive = user.status === 'active';
  const isSelf = !!currentUserId && user.id === currentUserId;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="p-1 text-muted-foreground/70 hover:text-primary rounded transition-colors"
      title="Copy"
    >
      {copied === label ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-success/80" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );

  const InfoRow = ({
    icon,
    label,
    value,
    copiable = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    copiable?: boolean;
  }) => (
    <div className="flex items-start justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-right">
        <span className="text-sm text-foreground font-medium">{value}</span>
        {copiable && <CopyButton text={value} label={label} />}
      </div>
    </div>
  );

  const profileEntries = Object.entries(user.profileData ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(user.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => !isSelf && onToggleStatus(user)}
            disabled={isSelf}
            title={isSelf ? "You can't change your own status" : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? 'text-warning bg-warning/10 border-orange-200 hover:bg-warning/15'
                : 'text-success bg-success/10 border-success/20 hover:bg-success/15'
            }`}
          >
            {isActive ? (
              <>
                <ToggleRight className="h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                Reactivate
              </>
            )}
          </button>
          <button
            onClick={() => !isSelf && onDelete(user)}
            disabled={isSelf}
            title={isSelf ? "You can't deactivate your own account" : undefined}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Deactivate
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
              {user.firstName[0]}{user.lastName?.[0] ?? ''}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30">
                  {typeConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success/50' : user.status === 'pending' ? 'bg-warning/60' : 'bg-secondary'}`} />
                  {statusConfig.label}
                </span>
                {isSelf && (
                  <span className="text-white/70 text-xs">(You)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Personal Information
            </h3>
            <div className="space-y-0">
              <InfoRow
                icon={<Hash className="h-3.5 w-3.5" />}
                label="User ID"
                value={user.id}
                copiable
              />
              <InfoRow
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                value={user.email}
                copiable
              />
              <InfoRow
                icon={<AtSign className="h-3.5 w-3.5" />}
                label="Username"
                value={user.username || '—'}
              />
              {user.phone && (
                <InfoRow
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="Phone"
                  value={user.phone}
                  copiable
                />
              )}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
                  {user.isEmailVerified ? <BadgeCheck className="h-3.5 w-3.5" /> : <BadgeX className="h-3.5 w-3.5" />}
                  <span className="text-xs font-medium">Email Verified</span>
                </div>
                <span className={`text-sm font-medium ${user.isEmailVerified ? 'text-success' : 'text-muted-foreground'}`}>
                  {user.isEmailVerified ? 'Verified' : 'Not verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Type-specific profile fields (free-form, backend-validated per type) */}
          {profileEntries.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                {typeConfig.label} Details
              </h3>
              <div className="space-y-0">
                {profileEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <span className="text-xs font-medium text-muted-foreground">{formatProfileFieldLabel(key)}</span>
                    <span className="text-sm font-medium text-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Effective permissions */}
          {permissions && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Effective Permissions
              </h3>
              {permissions.effectivePermissions && permissions.effectivePermissions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {permissions.effectivePermissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No permissions granted.</p>
              )}
              {permissions.overrides && permissions.overrides.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Individual overrides</p>
                  <div className="space-y-1.5">
                    {permissions.overrides.map((override) => (
                      <div key={override.permissionName} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{override.permissionName}</span>
                        <span className={override.isGranted ? 'text-success' : 'text-destructive'}>
                          {override.isGranted ? 'Granted' : 'Revoked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Account Information
            </h3>
            <div className="space-y-0">
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created"
                value={formatDateShort(user.createdAt)}
              />

              <InfoRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Last Login"
                value={user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
