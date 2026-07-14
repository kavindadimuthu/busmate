'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@busmate/ui';
import { Badge } from '@busmate/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@busmate/ui';
import {
  Clock,
  Bus,
  Users,
  Route,
  FileText,
  DollarSign,
  BarChart3,
  Navigation,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import UserData from '@/types/UserData';
import { useMyProfile } from '@/hooks/useMyProfile';
import { REQUIRED_PROFILE_FIELDS } from '@/lib/api/adminUsers';
import { USER_STATUS_CONFIG, timeAgo } from '@/data/admin/users';
import { ProfileInfoCard, PermissionsCard, ChangePasswordDialog } from '@/components/shared/profile';

interface OperatorProfileProps {
  userData: UserData | null;
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'FO';
}

export function OperatorProfile({ userData }: OperatorProfileProps) {
  useSetPageMetadata({
    title: 'My Profile',
    description: 'Manage your operator account settings, business information, and fleet preferences',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Profile' }],
  });

  const { user, permissions, loading, error, saving, saveProfile, changePassword } = useMyProfile();

  const initials = getInitials(userData?.firstName, userData?.lastName, userData?.email);
  const displayName = user?.fullName || userData?.firstName || userData?.email || 'Fleet Operator';
  const statusConfig = user ? USER_STATUS_CONFIG[user.accountStatus as keyof typeof USER_STATUS_CONFIG] : null;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-800 via-indigo-700 to-violet-700 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-card transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-card transform translate-y-16" />
        </div>
        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl shrink-0">
            <AvatarImage src="/images/placeholder-avatar.png" alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-indigo-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-indigo-200 mt-1">Fleet Operator</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {statusConfig && (
                <Badge className="bg-success/50/20 text-success-foreground/80 border border-success/40/30 backdrop-blur">
                  {statusConfig.label}
                </Badge>
              )}
              {user?.isEmailVerified && (
                <Badge className="bg-indigo-400/20 text-indigo-100 border border-indigo-400/30 backdrop-blur">Verified</Badge>
              )}
              <Badge className="bg-violet-400/20 text-violet-100 border border-violet-400/30 backdrop-blur">Operator</Badge>
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
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {user ? (
            <ProfileInfoCard
              user={user}
              requiredProfileFields={REQUIRED_PROFILE_FIELDS['operator'] ?? []}
              saving={saving}
              onSave={saveProfile}
              iconClassName="text-indigo-600"
            />
          ) : (
            <Card className="shadow-sm border-border/50">
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{loading ? 'Loading your profile…' : 'Profile unavailable.'}</p>
              </CardContent>
            </Card>
          )}

          {/* Operator Capabilities */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Operator Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Bus, color: 'indigo', label: 'Fleet Management', description: 'Register and manage buses across assigned routes' },
                  { icon: Route, color: 'blue', label: 'Service Permits', description: 'Apply for and manage passenger service permits' },
                  { icon: Navigation, color: 'teal', label: 'Trip Management', description: 'Schedule and oversee daily trip assignments' },
                  { icon: Users, color: 'green', label: 'Staff Management', description: 'Manage drivers, conductors, and support staff' },
                  { icon: DollarSign, color: 'amber', label: 'Revenue Tracking', description: 'Monitor fare collections and financial reports' },
                  { icon: BarChart3, color: 'purple', label: 'Performance Reports', description: 'View fleet performance and on-time metrics' },
                ].map(({ icon: Icon, color, label, description }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0 mt-0.5`}>
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

          <PermissionsCard permissions={permissions} iconClassName="text-indigo-600" />
        </div>

        {/* Right column */}
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
                    <Clock className="h-4 w-4 text-indigo-600" />
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

          {/* Fleet Statistics */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-semibold text-foreground">Fleet Statistics</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {[
                { icon: Bus, color: 'indigo', label: 'Total Buses', value: '—' },
                { icon: Route, color: 'blue', label: 'Active Routes', value: '—' },
                { icon: Users, color: 'green', label: 'Total Staff', value: '—' },
                { icon: Clock, color: 'amber', label: 'On-Time Rate', value: '—' },
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
