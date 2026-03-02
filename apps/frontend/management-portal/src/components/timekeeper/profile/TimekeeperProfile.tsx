'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Activity,
  Shield,
  Calendar,
  Bus,
  Users,
  CheckCircle,
  TimerIcon,
  MapPin,
  ClipboardList,
  Building2,
  Mail,
  User,
  IdCard,
  AlarmClock,
} from 'lucide-react';
import UserData from '@/types/UserData';

interface TimekeeperProfileProps {
  userData: UserData | null;
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'TK';
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    timeKeeper: 'Timekeeper Officer',
    mot: 'Ministry of Transport Officer',
    admin: 'System Administrator',
    operator: 'Fleet Operator',
  };
  return roleMap[role] || role;
}

const SHIFT_SCHEDULE = [
  { day: 'Monday', shift: 'Morning', time: '05:30 – 14:00', status: 'scheduled' },
  { day: 'Tuesday', shift: 'Morning', time: '05:30 – 14:00', status: 'scheduled' },
  { day: 'Wednesday', shift: 'Afternoon', time: '13:30 – 22:00', status: 'scheduled' },
  { day: 'Thursday', shift: 'Afternoon', time: '13:30 – 22:00', status: 'scheduled' },
  { day: 'Friday', shift: 'Morning', time: '05:30 – 14:00', status: 'scheduled' },
  { day: 'Saturday', shift: 'Off', time: '—', status: 'off' },
  { day: 'Sunday', shift: 'Off', time: '—', status: 'off' },
];

const SHIFT_COLORS: Record<string, string> = {
  Morning: 'bg-amber-100 text-amber-700',
  Afternoon: 'bg-blue-100 text-blue-700',
  Evening: 'bg-indigo-100 text-indigo-700',
  Night: 'bg-gray-200 text-gray-700',
  Off: 'bg-gray-100 text-gray-400',
};

export function TimekeeperProfile({ userData }: TimekeeperProfileProps) {
  useSetPageMetadata({
    title: 'My Profile',
    description: 'View and manage your timekeeper profile and work schedule',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Profile' }],
  });

  const initials = getInitials(userData?.firstName, userData?.lastName, userData?.email);
  const displayName =
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.firstName || userData?.email || 'Timekeeper Officer';

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white transform translate-y-16" />
        </div>
        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl shrink-0">
            <AvatarImage src="/images/placeholder-avatar.png" alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-teal-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-teal-100 mt-1">{formatRole(userData?.user_role || 'timeKeeper')}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <Badge className="bg-green-400/20 text-green-100 border border-green-400/30 backdrop-blur">
                Active
              </Badge>
              <Badge className="bg-teal-400/20 text-teal-100 border border-teal-400/30 backdrop-blur">
                Verified
              </Badge>
              <Badge className="bg-cyan-400/20 text-cyan-100 border border-cyan-400/30 backdrop-blur">
                Timekeeper
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
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
                  <span className="text-sm font-medium text-gray-800">
                    {formatRole(userData?.user_role || 'timeKeeper')}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Station</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Central Bus Terminal
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Staff ID</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-gray-400" />
                    {userData?.id ? `TK-${userData.id.slice(-6).toUpperCase()}` : 'TK-XXXXXX'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Work Schedule */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Weekly Work Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-2">
                {SHIFT_SCHEDULE.map(({ day, shift, time, status }) => (
                  <div
                    key={day}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      status === 'off' ? 'bg-gray-50' : 'bg-teal-50/60 hover:bg-teal-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === 'off' ? 'bg-gray-300' : 'bg-teal-500'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium w-24 ${
                          status === 'off' ? 'text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {time !== '—' && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                      )}
                      <Badge className={`text-xs ${SHIFT_COLORS[shift] || 'bg-gray-100 text-gray-500'} border-0`}>
                        {shift}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duties & Responsibilities */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Duties & Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Bus,
                    color: 'teal',
                    label: 'Trip Monitoring',
                    description: 'Record bus arrivals and departures at assigned terminal',
                  },
                  {
                    icon: Users,
                    color: 'blue',
                    label: 'Crew Attendance',
                    description: 'Track driver and conductor attendance for each shift',
                  },
                  {
                    icon: AlarmClock,
                    color: 'amber',
                    label: 'Delay Reporting',
                    description: 'Log and escalate schedule deviations in real time',
                  },
                  {
                    icon: MapPin,
                    color: 'green',
                    label: 'Stop Supervision',
                    description: 'Oversee bus stop operations and passenger boarding',
                  },
                  {
                    icon: CheckCircle,
                    color: 'purple',
                    label: 'Schedule Compliance',
                    description: 'Verify adherence to assigned route timetables',
                  },
                  {
                    icon: ClipboardList,
                    color: 'indigo',
                    label: 'Log Submission',
                    description: 'Submit daily shift reports and incident documentation',
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
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-teal-600" />
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

          {/* Shift Summary */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">This Week</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {[
                { icon: TimerIcon, color: 'teal', label: 'Scheduled Shifts', value: '5 days' },
                { icon: Bus, color: 'blue', label: 'Trips Monitored', value: '—' },
                { icon: Users, color: 'green', label: 'Crew Logged', value: '—' },
                { icon: CheckCircle, color: 'purple', label: 'On-time Rate', value: '—' },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${color}-600`} />
                    </div>
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Access Permissions */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                Access Level
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[
                  { module: 'Trip Monitoring', access: 'Full Access', color: 'green' },
                  { module: 'Attendance Tracking', access: 'Full Access', color: 'green' },
                  { module: 'Schedule Viewing', access: 'View Only', color: 'blue' },
                  { module: 'Route Management', access: 'No Access', color: 'red' },
                  { module: 'Fleet Management', access: 'No Access', color: 'red' },
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

          {/* Recent Activity */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-4">
                {[
                  { dot: 'teal', text: 'Logged into portal', time: 'Just now' },
                  { dot: 'green', text: 'Trip log submitted', time: 'Yesterday' },
                  { dot: 'blue', text: 'Attendance recorded', time: '2 days ago' },
                  { dot: 'amber', text: 'Delay reported — Route 120', time: 'Last week' },
                ].map(({ dot, text, time }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${dot}-500 mt-1.5 shrink-0`} />
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
