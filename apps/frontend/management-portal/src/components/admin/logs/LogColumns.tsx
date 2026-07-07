'use client';

import * as React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Smartphone,
  LogIn,
  LogOut,
  Key,
  UserCog,
  Shield,
  Lock,
  Globe,
  Info,
  Bug,
  Terminal,
  Server,
} from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';
import type { UserActivityLog, SecurityLog, ApplicationLog } from '@/data/admin/types';

// ─── User Activity ────────────────────────────────────────────────────────────

function getUserTypeBadge(userType: string) {
  const colors: Record<string, string> = {
    Administrator: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    Conductor: 'bg-primary/10 text-primary border border-primary/20',
    'Fleet Manager': 'bg-warning/10 text-orange-700 border border-orange-200',
    Passenger: 'bg-success/10 text-success border border-success/20',
    'MOT Officer': 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    Timekeeper: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  };
  return colors[userType] || 'bg-muted text-muted-foreground border border-border';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return { className: 'bg-success/10 text-success border border-success/20', icon: <CheckCircle className="h-3 w-3" />, label: 'Success' };
    case 'error':
      return { className: 'bg-destructive/10 text-destructive border border-destructive/20', icon: <XCircle className="h-3 w-3" />, label: 'Error' };
    case 'warning':
      return { className: 'bg-warning/10 text-warning border border-warning/20', icon: <AlertTriangle className="h-3 w-3" />, label: 'Warning' };
    default:
      return { className: 'bg-muted text-muted-foreground border border-border', icon: null, label: status };
  }
}

export const userActivityColumns: ColumnDef<UserActivityLog>[] = [
  {
    id: 'timestamp',
    header: 'Timestamp',
    sortable: true,
    width: 'w-44',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
        {row.timestamp}
      </span>
    ),
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{row.userName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getUserTypeBadge(row.userType)}`}>
            {row.userType}
          </span>
          <span className="text-[10px] text-muted-foreground/70">{row.userId}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Action',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">{row.action}</span>
    ),
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => (
      <p className="text-sm text-muted-foreground max-w-xs truncate">{row.details}</p>
    ),
  },
  {
    id: 'location',
    header: 'Location',
    hideBelow: 'lg',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Smartphone className="h-3 w-3 shrink-0" />
          <span className="truncate">{row.device}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{row.location}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    align: 'center',
    cell: ({ row }) => {
      const badge = getStatusBadge(row.status);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
      );
    },
  },
];

// ─── Security Logs ────────────────────────────────────────────────────────────

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return { className: 'bg-destructive text-white', icon: <XCircle className="h-3 w-3" />, label: 'Critical' };
    case 'high':
      return { className: 'bg-destructive/10 text-destructive border border-destructive/20', icon: <AlertTriangle className="h-3 w-3" />, label: 'High' };
    case 'medium':
      return { className: 'bg-warning/10 text-warning border border-warning/20', icon: <AlertTriangle className="h-3 w-3" />, label: 'Medium' };
    case 'low':
      return { className: 'bg-success/10 text-success border border-success/20', icon: <Lock className="h-3 w-3" />, label: 'Low' };
    default:
      return { className: 'bg-muted text-muted-foreground border border-border', icon: <Shield className="h-3 w-3" />, label: severity };
  }
}

function getEventTypeInfo(eventType: string) {
  const types: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    login: { icon: <LogIn className="h-3.5 w-3.5" />, label: 'Login', color: 'text-success' },
    logout: { icon: <LogOut className="h-3.5 w-3.5" />, label: 'Logout', color: 'text-muted-foreground' },
    failed_login: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Failed Login', color: 'text-destructive' },
    password_change: { icon: <Key className="h-3.5 w-3.5" />, label: 'Password Change', color: 'text-primary' },
    permission_change: { icon: <UserCog className="h-3.5 w-3.5" />, label: 'Permission Change', color: 'text-purple-600 dark:text-purple-400' },
    suspicious_activity: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Suspicious Activity', color: 'text-warning' },
  };
  return types[eventType] || { icon: <Shield className="h-3.5 w-3.5" />, label: eventType, color: 'text-muted-foreground' };
}

export const securityLogColumns: ColumnDef<SecurityLog>[] = [
  {
    id: 'timestamp',
    header: 'Timestamp',
    sortable: true,
    width: 'w-44',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
        {row.timestamp}
      </span>
    ),
  },
  {
    id: 'severity',
    header: 'Severity',
    sortable: true,
    cell: ({ row }) => {
      const badge = getSeverityBadge(row.severity);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
      );
    },
  },
  {
    id: 'eventType',
    header: 'Event Type',
    sortable: true,
    cell: ({ row }) => {
      const info = getEventTypeInfo(row.eventType);
      return (
        <div className={`flex items-center gap-1.5 ${info.color}`}>
          {info.icon}
          <span className="text-sm font-medium">{info.label}</span>
        </div>
      );
    },
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => (
      <p className="text-sm text-muted-foreground max-w-sm truncate">{row.details}</p>
    ),
  },
  {
    id: 'source',
    header: 'Source',
    hideBelow: 'lg',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="font-mono">{row.ipAddress}</span>
        </div>
        <p className="text-[10px] text-muted-foreground/70 max-w-[200px] truncate">{row.userAgent}</p>
      </div>
    ),
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) =>
      row.userName ? (
        <div>
          <p className="text-sm font-medium text-foreground">{row.userName}</p>
          <p className="text-[10px] text-muted-foreground/70">{row.userId}</p>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/70">—</span>
      ),
  },
];

// ─── Application Logs ─────────────────────────────────────────────────────────

function getLevelBadge(level: string) {
  switch (level) {
    case 'ERROR':
      return { className: 'bg-destructive/10 text-destructive border border-destructive/20', icon: <XCircle className="h-3 w-3" /> };
    case 'WARN':
      return { className: 'bg-warning/10 text-warning border border-warning/20', icon: <AlertTriangle className="h-3 w-3" /> };
    case 'INFO':
      return { className: 'bg-primary/10 text-primary border border-primary/20', icon: <Info className="h-3 w-3" /> };
    case 'DEBUG':
      return { className: 'bg-muted text-muted-foreground border border-border', icon: <Bug className="h-3 w-3" /> };
    default:
      return { className: 'bg-muted text-muted-foreground border border-border', icon: <Terminal className="h-3 w-3" /> };
  }
}

const serviceColors: Record<string, string> = {
  'route-management': 'bg-primary/15 text-primary',
  'ticketing-management': 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'user-management': 'bg-success/15 text-success',
  'location-tracking': 'bg-warning/15 text-orange-700',
  'notification-service': 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  'payment-service': 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  'analytics-service': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  'api-gateway': 'bg-primary/15 text-primary',
};

export const applicationLogColumns: ColumnDef<ApplicationLog>[] = [
  {
    id: 'timestamp',
    header: 'Timestamp',
    sortable: true,
    width: 'w-44',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
        {row.timestamp}
      </span>
    ),
  },
  {
    id: 'level',
    header: 'Level',
    sortable: true,
    cell: ({ row }) => {
      const badge = getLevelBadge(row.level);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${badge.className}`}>
          {badge.icon}
          {row.level}
        </span>
      );
    },
  },
  {
    id: 'service',
    header: 'Service',
    sortable: true,
    cell: ({ row }) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${serviceColors[row.service] || 'bg-muted text-foreground/80'}`}>
        <Server className="h-3 w-3 shrink-0" />
        {row.service}
      </span>
    ),
  },
  {
    id: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <p className="text-sm text-foreground/80 truncate max-w-lg">{row.message}</p>
    ),
  },
];
