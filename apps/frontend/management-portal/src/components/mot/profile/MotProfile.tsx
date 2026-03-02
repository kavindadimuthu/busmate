'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Activity,
  Shield,
  Route,
  MapPin,
  Users,
  FileText,
  Bus,
  BarChart3,
  Building2,
  Mail,
  User,
  IdCard,
} from 'lucide-react';
import UserData from '@/types/UserData';

interface MotProfileProps {
  userData: UserData | null;
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'MO';
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    MOT: 'Ministry of Transport Officer',
    mot: 'Ministry of Transport Officer',
    admin: 'System Administrator',
    operator: 'Fleet Operator',
    timeKeeper: 'Timekeeper',
  };
  return roleMap[role] || role;
}

export function MotProfile({ userData }: MotProfileProps) {
  useSetPageMetadata({
    title: 'My Profile',
    description: 'View and manage your MOT officer profile and account information',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Profile' }],
  });

  const initials = getInitials(userData?.firstName, userData?.lastName, userData?.email);
  const displayName =
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.firstName || userData?.email || 'MOT Officer';

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white transform translate-y-16" />
        </div>
        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl shrink-0">
            <AvatarImage src="/images/placeholder-avatar.png" alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-blue-200 mt-1">{formatRole(userData?.user_role || 'mot')}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <Badge className="bg-green-400/20 text-green-100 border border-green-400/30 backdrop-blur">
                Active
              </Badge>
              <Badge className="bg-blue-400/20 text-blue-100 border border-blue-400/30 backdrop-blur">
                Verified
              </Badge>
              <Badge className="bg-purple-400/20 text-purple-100 border border-purple-400/30 backdrop-blur">
                MOT Officer
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — personal info + role info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Full Name</span>
                  <span className="text-sm font-medium text-gray-800">{displayName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {userData?.email || 'Not provided'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Username</span>
                  <span className="text-sm font-medium text-gray-800">{userData?.username || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">System Role</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {formatRole(userData?.user_role || 'mot')}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Department</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Ministry of Transport
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Staff ID</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-gray-400" />
                    {userData?.id ? `MOT-${userData.id.slice(-6).toUpperCase()}` : 'MOT-XXXXXX'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MOT Responsibilities */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
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
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Access Permissions */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Access & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[
                  { module: 'Route & Schedule Management', access: 'Full Access', color: 'green' },
                  { module: 'Permit Management', access: 'Full Access', color: 'green' },
                  { module: 'Operator Management', access: 'Full Access', color: 'green' },
                  { module: 'Bus & Fleet Information', access: 'Full Access', color: 'green' },
                  { module: 'Staff Management', access: 'Full Access', color: 'green' },
                  { module: 'Analytics & Reports', access: 'View & Export', color: 'blue' },
                  { module: 'System Administration', access: 'No Access', color: 'red' },
                ].map(({ module, access, color }) => (
                  <div key={module} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{module}</span>
                    <Badge
                      className={
                        color === 'green'
                          ? 'bg-green-100 text-green-700 border-0'
                          : color === 'blue'
                          ? 'bg-blue-100 text-blue-700 border-0'
                          : 'bg-red-100 text-red-700 border-0'
                      }
                    >
                      {access}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — stats + activity */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Last Login</span>
                </div>
                <span className="text-sm font-medium text-gray-800">Today</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Account Status</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">Security</span>
                </div>
                <span className="text-sm font-medium text-green-600">Verified</span>
              </div>
            </CardContent>
          </Card>

          {/* Network Statistics */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">Network Overview</CardTitle>
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
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-4">
                {[
                  { dot: 'blue', text: 'Logged into the portal', time: 'Just now' },
                  { dot: 'green', text: 'Route configuration updated', time: 'Yesterday' },
                  { dot: 'purple', text: 'Permit batch reviewed', time: '2 days ago' },
                  { dot: 'orange', text: 'Operator audit completed', time: 'Last week' },
                ].map(({ dot, text, time }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full bg-${dot}-500 mt-1.5 shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
