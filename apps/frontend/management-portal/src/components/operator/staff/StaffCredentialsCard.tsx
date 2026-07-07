'use client';

import { FileText, Car, UserCheck, AlertTriangle, CheckCircle, Languages } from 'lucide-react';
import type { Driver, Conductor, StaffMember } from '@/data/operator/staff';

interface StaffCredentialsCardProps {
  staff: StaffMember;
}

function isDriver(staff: StaffMember): staff is Driver {
  return staff.role === 'DRIVER';
}

function LicenseTypeLabel(type: Driver['license']['licenseType']) {
  const map: Record<Driver['license']['licenseType'], string> = {
    HEAVY_VEHICLE: 'Heavy Vehicle',
    LIGHT_VEHICLE: 'Light Vehicle',
    COMMERCIAL:    'Commercial',
  };
  return map[type] ?? type;
}

export function StaffCredentialsCard({ staff }: StaffCredentialsCardProps) {
  if (isDriver(staff)) {
    const license = staff.license;
    const expiry  = new Date(license.expiryDate);
    const now     = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft > 0 && daysLeft <= 90;
    const isExpired      = daysLeft <= 0;

    return (
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
          <Car className="w-4 h-4 text-success/80" />
          <h2 className="text-sm font-semibold text-foreground">Driving License</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">License Number</p>
              <p className="text-sm font-mono font-medium text-foreground">{license.licenseNumber}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">License Type</p>
              <p className="text-sm font-medium text-foreground">{LicenseTypeLabel(license.licenseType)}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Issued Date</p>
              <p className="text-sm text-foreground">{new Date(license.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className={`rounded-lg p-3 ${isExpired ? 'bg-destructive/10' : isExpiringSoon ? 'bg-warning/10' : 'bg-muted'}`}>
              <p className="text-xs text-muted-foreground mb-0.5">Expiry Date</p>
              <p className={`text-sm font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : 'text-foreground'}`}>
                {expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              {isExpired && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> Expired
                </span>
              )}
              {isExpiringSoon && (
                <span className="inline-flex items-center gap-1 text-xs text-warning mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> {daysLeft} days left
                </span>
              )}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Issued Province</p>
            <p className="text-sm text-foreground">{license.issuedProvince} Province</p>
          </div>

          {/* Experience */}
          <div className="pt-3 mt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Years of Experience</p>
                <p className="text-lg font-bold text-success">{staff.yearsOfExperience} years</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total KM Driven</p>
                <p className="text-lg font-bold text-foreground/80">{staff.totalKmDriven.toLocaleString()} km</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conductor credentials
  const conductor = staff as Conductor;
  const certExpiry = new Date(conductor.certificationExpiryDate);
  const now        = new Date();
  const daysLeft   = Math.ceil((certExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 90;
  const isExpired      = daysLeft <= 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <UserCheck className="w-4 h-4 text-purple-500" />
        <h2 className="text-sm font-semibold text-foreground">Conductor Certification</h2>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Certificate Number</p>
          <p className="text-sm font-mono font-medium text-foreground">{conductor.certificateNumber}</p>
        </div>

        <div className={`rounded-lg p-3 ${isExpired ? 'bg-destructive/10' : isExpiringSoon ? 'bg-warning/10' : 'bg-muted'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Certification Expiry</p>
              <p className={`text-sm font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : 'text-foreground'}`}>
                {certExpiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            {!isExpired && !isExpiringSoon && <CheckCircle className="w-5 h-5 text-success/80" />}
            {isExpiringSoon && <AlertTriangle className="w-5 h-5 text-warning" />}
            {isExpired && <AlertTriangle className="w-5 h-5 text-destructive/80" />}
          </div>
          {isExpired && <p className="text-xs text-destructive mt-1">Certification expired – renewal required</p>}
          {isExpiringSoon && <p className="text-xs text-warning mt-1">{daysLeft} days until expiry</p>}
        </div>

        {/* Languages */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Languages Spoken</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {conductor.languagesSpoken.map(lang => (
              <span key={lang} className="px-3 py-1 rounded-full text-sm bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-800))] border border-purple-100 font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
