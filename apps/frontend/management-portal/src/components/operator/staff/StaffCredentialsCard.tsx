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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Car className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-900">Driving License</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">License Number</p>
              <p className="text-sm font-mono font-medium text-gray-900">{license.licenseNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">License Type</p>
              <p className="text-sm font-medium text-gray-900">{LicenseTypeLabel(license.licenseType)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Issued Date</p>
              <p className="text-sm text-gray-900">{new Date(license.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500 mb-0.5">Expiry Date</p>
              <p className={`text-sm font-medium ${isExpired ? 'text-red-700' : isExpiringSoon ? 'text-yellow-700' : 'text-gray-900'}`}>
                {expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              {isExpired && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> Expired
                </span>
              )}
              {isExpiringSoon && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-600 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> {daysLeft} days left
                </span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Issued Province</p>
            <p className="text-sm text-gray-900">{license.issuedProvince} Province</p>
          </div>

          {/* Experience */}
          <div className="pt-3 mt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Years of Experience</p>
                <p className="text-lg font-bold text-green-700">{staff.yearsOfExperience} years</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total KM Driven</p>
                <p className="text-lg font-bold text-gray-700">{staff.totalKmDriven.toLocaleString()} km</p>
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <UserCheck className="w-4 h-4 text-purple-500" />
        <h2 className="text-sm font-semibold text-gray-900">Conductor Certification</h2>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Certificate Number</p>
          <p className="text-sm font-mono font-medium text-gray-900">{conductor.certificateNumber}</p>
        </div>

        <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Certification Expiry</p>
              <p className={`text-sm font-medium ${isExpired ? 'text-red-700' : isExpiringSoon ? 'text-yellow-700' : 'text-gray-900'}`}>
                {certExpiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            {!isExpired && !isExpiringSoon && <CheckCircle className="w-5 h-5 text-green-500" />}
            {isExpiringSoon && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            {isExpired && <AlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
          {isExpired && <p className="text-xs text-red-600 mt-1">Certification expired – renewal required</p>}
          {isExpiringSoon && <p className="text-xs text-yellow-600 mt-1">{daysLeft} days until expiry</p>}
        </div>

        {/* Languages */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Languages Spoken</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {conductor.languagesSpoken.map(lang => (
              <span key={lang} className="px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-800 border border-purple-100 font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
