'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@busmate/ui';
import { Badge } from '@busmate/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@busmate/ui';
import {
  Clock,
  Route,
  MapPin,
  Users,
  FileText,
  Bus,
  BarChart3,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react';
import UserData from '@/types/UserData';
import { useMyProfile } from '@/hooks/useMyProfile';
import { REQUIRED_PROFILE_FIELDS } from '@/lib/api/adminUsers';
import { USER_STATUS_CONFIG, timeAgo } from '@/data/admin/users';
import { ProfileInfoCard, PermissionsCard, ChangePasswordDialog } from '@/components/shared/profile';

interface MotProfileProps {
  userData: UserData | null;
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'MO';
}

export function MotProfile({ userData }: MotProfileProps) {
  useSetPageMetadata({
    title: 'My Profile',
    description: 'View and manage your MOT officer profile and account information',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Profile' }],
  });

  const { user, permissions, loading, error, saving, saveProfile, changePassword } = useMyProfile();

  const initials = getInitials(userData?.firstName, userData?.lastName, userData?.email);
  const displayName = user?.fullName || userData?.firstName || userData?.email || 'MOT Officer';
  const statusConfig = user ? USER_STATUS_CONFIG[user.accountStatus as keyof typeof USER_STATUS_CONFIG] : null;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-card transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-card transform translate-y-16" />
        </div>
        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl shrink-0">
            <AvatarImage src="/images/placeholder-avatar.png" alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-primary/80 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-primary/30 mt-1">Ministry of Transport Officer</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {statusConfig && (
                <Badge className="bg-success/50/20 text-success-foreground/80 border border-success/40/30 backdrop-blur">
                  {statusConfig.label}
                </Badge>
              )}
              {user?.isEmailVerified && (
                <Badge className="bg-primary/50/20 text-primary/20 border border-primary/40/30 backdrop-blur">Verified</Badge>
              )}
              <Badge className="bg-purple-400/20 text-[hsl(var(--purple-100))] border border-purple-400/30 backdrop-blur">
                MOT Officer
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — personal info + role info */}
        <div className="lg:col-span-2 space-y-6">
          {user ? (
            <ProfileInfoCard
              user={user}
              requiredProfileFields={REQUIRED_PROFILE_FIELDS['mot'] ?? []}
              saving={saving}
              onSave={saveProfile}
            />
          ) : (
            <Card className="shadow-sm border-border/50">
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{loading ? 'Loading your profile…' : 'Profile unavailable.'}</p>
              </CardContent>
            </Card>
          )}

          {/* MOT Responsibilities */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                MOT Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Route,
                    color: 'blue',
                    label: 'Route Management',
                    description: 'Define, update, and oversee bus route configurations',
                  },
                  {
                    icon: FileText,
                    color: 'purple',
                    label: 'Permit Management',
                    description: 'Issue and validate passenger service permits',
                  },
                  {
                    icon: Users,
                    color: 'green',
                    label: 'Operator Oversight',
                    description: 'Monitor and manage fleet operators across the network',
                  },
                  {
                    icon: Bus,
                    color: 'orange',
                    label: 'Bus Compliance',
                    description: 'Ensure vehicle standards and regulatory compliance',
                  },
                  {
                    icon: MapPin,
                    color: 'teal',
                    label: 'Bus Stop Administration',
                    description: 'Manage bus stop locations and infrastructure data',
                  },
                  {
                    icon: BarChart3,
                    color: 'indigo',
                    label: 'Analytics & Reporting',
                    description: 'Generate transport network performance reports',
                  },
                ].map(({ icon: Icon, color, label, description }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PermissionsCard permissions={permissions} />
        </div>

        {/* Right column — stats + activity */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Last Login</span>
                </div>
                <span className="text-sm font-medium text-foreground">{user ? timeAgo(user.lastLoginAt ?? null) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <BadgeCheck className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">Account Status</span>
                </div>
                {statusConfig ? (
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>{statusConfig.label}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--purple-50))] flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-[hsl(var(--purple-600))]" />
                  </div>
                  <span className="text-sm text-muted-foreground">Email Verified</span>
                </div>
                <span className={`text-sm font-medium ${user?.isEmailVerified ? 'text-success' : 'text-muted-foreground'}`}>
                  {user ? (user.isEmailVerified ? 'Verified' : 'Not verified') : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Network Statistics */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground">Network Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {[
                { icon: Route, color: 'blue', label: 'Managed Routes', value: '—' },
                { icon: Bus, color: 'orange', label: 'Registered Buses', value: '—' },
                { icon: Users, color: 'green', label: 'Active Operators', value: '—' },
                { icon: FileText, color: 'purple', label: 'Active Permits', value: '—' },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${color}-600`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground/70">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground">Security</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm text-muted-foreground">Change your password regularly to keep your account secure.</p>
              <ChangePasswordDialog saving={saving} onSubmit={changePassword} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
