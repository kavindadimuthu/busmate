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
  MapPin,
  Calendar,
  Clock,
  Shield,
  Truck,
  Car,
  CircleDot,
  Users,
  CreditCard,
  Star,
  Building2,
  BadgeCheck,
  FileText,
  Copy,
  CheckCircle2,
  Hash,
  Briefcase,
  Route,
} from 'lucide-react';
import {
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  getUserDisplayName,
  formatUserDate,
  formatDateShort,
  timeAgo,
} from '@/data/admin/users';
import type {
  SystemUser,
  MOTUser,
  TimekeeperUser,
  OperatorUser,
  ConductorUser,
  DriverUser,
  PassengerUser,
} from '@/data/admin/users';

interface UserDetailPanelProps {
  user: SystemUser;
  onBack: () => void;
  onEdit: (userId: string) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
}

export function UserDetailPanel({
  user,
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
            onClick={() => onToggleStatus(user)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
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
            onClick={() => onDelete(user)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/15 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30`}>
                  {typeConfig.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-card/20 text-white border border-white/30`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success/50' : user.status === 'suspended' ? 'bg-destructive/50' : user.status === 'pending' ? 'bg-warning/60' : 'bg-secondary'}`} />
                  {statusConfig.label}
                </span>
                <span className="text-white/70 text-xs">{user.id}</span>
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
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={user.phone}
                copiable
              />
              <InfoRow
                icon={<FileText className="h-3.5 w-3.5" />}
                label="NIC"
                value={user.nic}
                copiable
              />
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Address"
                value={user.address}
              />
            </div>
          </div>

          {/* Type-specific details */}
          {renderTypeSpecificDetails(user)}
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

          {/* Notes */}
          {user.notes && (
            <div className="bg-warning/10 rounded-xl border border-warning/20 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm text-warning leading-relaxed">{user.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderTypeSpecificDetails(user: SystemUser) {
  switch (user.userType) {
    case 'mot':
      return <MOTDetails user={user} />;
    case 'timekeeper':
      return <TimekeeperDetails user={user} />;
    case 'operator':
      return <OperatorDetails user={user} />;
    case 'conductor':
      return <ConductorDetails user={user} />;
    case 'driver':
      return <DriverDetails user={user} />;
    case 'passenger':
      return <PassengerDetails user={user} />;
    default:
      return null;
  }
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{String(value)}</span>
    </div>
  );
}

function MOTDetails({ user }: { user: MOTUser }) {
  const clearanceColors: Record<string, string> = {
    basic: 'bg-muted text-foreground/80',
    standard: 'bg-primary/15 text-primary',
    enhanced: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]',
    'top-secret': 'bg-destructive/15 text-destructive',
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-indigo-600" />
        MOT Officer Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Employee ID" value={user.employeeId} />
        <DetailRow label="Department" value={user.department} />
        <DetailRow label="Designation" value={user.designation} />
        <DetailRow label="Office Location" value={user.officeLocation} />
        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">Security Clearance</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${clearanceColors[user.securityClearance] || 'bg-muted text-foreground/80'}`}>
            {user.securityClearance.charAt(0).toUpperCase() + user.securityClearance.slice(1)}
          </span>
        </div>
        <div className="py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Permissions</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="text-xs px-2 py-0.5 bg-primary/10 text-indigo-700 rounded-full border border-indigo-200"
              >
                {perm.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimekeeperDetails({ user }: { user: TimekeeperUser }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-teal-600" />
        Timekeeper Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Employee ID" value={user.employeeId} />
        <DetailRow label="Assigned Terminal" value={user.assignedTerminal} />
        <DetailRow label="Assigned Route" value={user.assignedRoute} />
        <DetailRow label="Shift" value={user.shift} />
        <DetailRow label="Supervisor" value={user.supervisor} />
      </div>
    </div>
  );
}

function OperatorDetails({ user }: { user: OperatorUser }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Truck className="h-4 w-4 text-warning" />
        Operator Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Company Name" value={user.companyName} />
        <DetailRow label="Registration Number" value={user.registrationNumber} />
        <DetailRow label="Operator License" value={user.operatorLicense} />
        <DetailRow label="Total Buses" value={user.totalBuses} />
        <DetailRow label="Active Buses" value={user.activeBuses} />
        <DetailRow label="Total Routes" value={user.totalRoutes} />
      </div>
    </div>
  );
}

function ConductorDetails({ user }: { user: ConductorUser }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <CircleDot className="h-4 w-4 text-success" />
        Conductor Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Employee ID" value={user.employeeId} />
        <DetailRow label="License Number" value={user.licenseNumber} />
        <DetailRow label="Assigned Bus" value={user.assignedBus || 'Not assigned'} />
        <DetailRow label="Assigned Route" value={user.assignedRoute || 'Not assigned'} />
        <DetailRow label="Operator" value={user.operatorName} />
        <DetailRow label="Total Trips" value={user.totalTrips.toLocaleString()} />
        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">Rating</span>
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Star className="h-3.5 w-3.5 text-warning fill-yellow-500" />
            {user.rating > 0 ? user.rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

function DriverDetails({ user }: { user: DriverUser }) {
  const isExpired = new Date(user.drivingLicenseExpiry) < new Date();
  const isExpiringSoon = !isExpired && (new Date(user.drivingLicenseExpiry).getTime() - new Date().getTime()) < 90 * 86400000;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Car className="h-4 w-4 text-primary" />
        Driver Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Employee ID" value={user.employeeId} />
        <DetailRow label="License Number" value={user.drivingLicenseNumber} />
        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">License Expiry</span>
          <span className={`text-sm font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : 'text-foreground'}`}>
            {formatDateShort(user.drivingLicenseExpiry)}
            {isExpired && <span className="text-xs ml-1">(Expired)</span>}
            {isExpiringSoon && <span className="text-xs ml-1">(Expiring Soon)</span>}
          </span>
        </div>
        <div className="py-2.5 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">Vehicle Classes</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {user.vehicleClasses.map((cls) => (
              <span key={cls} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 font-medium">
                Class {cls}
              </span>
            ))}
          </div>
        </div>
        <DetailRow label="Assigned Bus" value={user.assignedBus || 'Not assigned'} />
        <DetailRow label="Assigned Route" value={user.assignedRoute || 'Not assigned'} />
        <DetailRow label="Operator" value={user.operatorName} />
        <DetailRow label="Total Trips" value={user.totalTrips.toLocaleString()} />
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Rating</span>
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Star className="h-3.5 w-3.5 text-warning fill-yellow-500" />
            {user.rating > 0 ? user.rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

function PassengerDetails({ user }: { user: PassengerUser }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-[hsl(var(--purple-600))]" />
        Passenger Details
      </h3>
      <div className="space-y-0">
        <DetailRow label="Total Trips" value={user.totalTrips.toLocaleString()} />
        <DetailRow label="Total Spent" value={`Rs ${user.totalSpent.toLocaleString()}`} />
        <DetailRow label="Wallet Balance" value={`Rs ${user.walletBalance.toLocaleString()}`} />
        <DetailRow label="Preferred Payment" value={user.preferredPayment.charAt(0).toUpperCase() + user.preferredPayment.slice(1)} />
        {user.savedRoutes.length > 0 && (
          <div className="py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Saved Routes</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.savedRoutes.map((route) => (
                <span
                  key={route}
                  className="text-xs px-2 py-0.5 bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] rounded-full border border-[hsl(var(--purple-200))]"
                >
                  {route}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
