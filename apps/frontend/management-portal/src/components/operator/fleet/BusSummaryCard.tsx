'use client';

import React from 'react';
import {
  Bus, CheckCircle, XCircle, Wrench, AlertCircle, Calendar, Gauge,
  Shield, FileText, User, Phone, MapPin, Clock,
} from 'lucide-react';
import type { OperatorBus } from '@/data/operator/buses';

interface BusSummaryCardProps {
  bus: OperatorBus;
}

const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  ACTIVE:      { label: 'Active',      classes: 'bg-green-100 text-green-800 border-green-200',   icon: <CheckCircle className="w-4 h-4" /> },
  INACTIVE:    { label: 'Inactive',    classes: 'bg-orange-100 text-orange-800 border-orange-200', icon: <XCircle className="w-4 h-4" /> },
  MAINTENANCE: { label: 'Maintenance', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Wrench className="w-4 h-4" /> },
  RETIRED:     { label: 'Retired',     classes: 'bg-gray-100 text-gray-600 border-gray-200',       icon: <AlertCircle className="w-4 h-4" /> },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  SL:          'SL (Normal)',
  SL_AC:       'SL A/C',
  SEMI_LUXURY: 'Semi-Luxury',
  LUXURY:      'Luxury',
  EXPRESS:     'Express',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function isExpiringSoon(iso?: string, days = 60) {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < days * 86400_000;
}

function isExpired(iso?: string) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function ExpiryValue({ date }: { date: string }) {
  const expired  = isExpired(date);
  const soon     = isExpiringSoon(date);
  const cls = expired ? 'text-red-700 font-semibold' : soon ? 'text-amber-700 font-semibold' : 'text-gray-900';
  const tag = expired ? ' (Expired)' : soon ? ' (Expiring soon)' : '';
  return <span className={cls}>{formatDate(date)}{tag}</span>;
}

export function BusSummaryCard({ bus }: BusSummaryCardProps) {
  const status = STATUS_META[bus.status] ?? STATUS_META.RETIRED;

  const enabledFacilities = Object.entries(bus.facilities)
    .filter(([k, v]) => k !== 'emergencyExits' && v === true)
    .map(([k]) =>
      ({
        ac: 'Air Conditioning', wifi: 'WiFi', cctv: 'CCTV', gps: 'GPS',
        audioSystem: 'Audio System', chargingPorts: 'Charging Ports',
        wheelchairAccessible: 'Wheelchair Accessible', airSuspension: 'Air Suspension',
        toilet: 'Toilet', tvScreens: 'TV Screens', readingLights: 'Reading Lights',
        seatBelts: 'Seat Belts', fireExtinguisher: 'Fire Extinguisher',
      } as Record<string, string>)[k] ?? k
    );

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Bus className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{bus.plateNumber}</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{bus.ntcRegistrationNumber}</p>
              <p className="text-sm text-gray-600 mt-1">{bus.manufacturer} {bus.model} · {bus.year}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${status.classes}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Quick stats row */}
        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Gauge className="w-4 h-4 text-purple-500" />, label: 'Seating', value: `${bus.seatingCapacity} seats` },
            { icon: <Calendar className="w-4 h-4 text-blue-500" />, label: 'Year',    value: bus.year },
            { icon: <Gauge className="w-4 h-4 text-orange-500" />,  label: 'Mileage', value: `${bus.mileage.toLocaleString()} km` },
            { icon: <Shield className="w-4 h-4 text-green-500" />,  label: 'Type',    value: SERVICE_TYPE_LABELS[bus.serviceType] ?? bus.serviceType },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              {item.icon}
              <div>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technical details */}
        <Section title="Technical Details" icon={<Bus className="w-4 h-4" />}>
          <InfoRow label="Manufacturer"    value={bus.manufacturer} />
          <InfoRow label="Model"           value={bus.model} />
          <InfoRow label="Year"            value={bus.year} />
          <InfoRow label="Color"           value={bus.color} />
          <InfoRow label="Chassis Number"  value={<span className="font-mono text-xs">{bus.chassisNumber}</span>} />
          <InfoRow label="Engine Number"   value={<span className="font-mono text-xs">{bus.engineNumber}</span>} />
          <InfoRow label="Service Type"    value={SERVICE_TYPE_LABELS[bus.serviceType] ?? bus.serviceType} />
          <InfoRow label="Seating Capacity" value={`${bus.seatingCapacity} seats`} />
          {bus.standingCapacity > 0 && <InfoRow label="Standing Capacity" value={`${bus.standingCapacity} passengers`} />}
          <InfoRow label="Mileage"         value={`${bus.mileage.toLocaleString()} km`} />
        </Section>

        {/* Licensing & compliance */}
        <Section title="Licensing & Compliance" icon={<FileText className="w-4 h-4" />}>
          <InfoRow label="Insurance No."       value={<span className="font-mono text-xs">{bus.insuranceNumber}</span>} />
          <InfoRow label="Insurance Expiry"    value={<ExpiryValue date={bus.insuranceExpiryDate} />} />
          <InfoRow label="Revenue Licence Exp." value={<ExpiryValue date={bus.revenueLicenseExpiryDate} />} />
          <InfoRow label="Last Service"        value={formatDate(bus.lastServiceDate)} />
          <InfoRow label="Next Service Due"    value={<ExpiryValue date={bus.nextServiceDate} />} />
          <InfoRow label="NTC Reg. Number"     value={<span className="font-mono text-xs">{bus.ntcRegistrationNumber}</span>} />
        </Section>

        {/* Staff */}
        <Section title="Assigned Staff" icon={<User className="w-4 h-4" />}>
          {bus.driver ? (
            <>
              <InfoRow label="Driver"         value={bus.driver.driverName} />
              <InfoRow label="Driver Licence"  value={<span className="font-mono text-xs">{bus.driver.licenseNumber}</span>} />
              <InfoRow
                label="Driver Contact"
                value={
                  <a href={`tel:${bus.driver.contactPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {bus.driver.contactPhone}
                  </a>
                }
              />
              <InfoRow label="Assigned Since"  value={formatDate(bus.driver.assignedSince)} />
            </>
          ) : (
            <p className="text-sm text-gray-400 italic py-2">No driver assigned</p>
          )}

          {bus.conductor && (
            <>
              <div className="my-2 border-t border-dashed border-gray-200" />
              <InfoRow label="Conductor"        value={bus.conductor.conductorName} />
              <InfoRow
                label="Conductor Contact"
                value={
                  <a href={`tel:${bus.conductor.contactPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {bus.conductor.contactPhone}
                  </a>
                }
              />
              <InfoRow label="Assigned Since"   value={formatDate(bus.conductor.assignedSince)} />
            </>
          )}
        </Section>

        {/* Route assignment */}
        <Section title="Route Assignments" icon={<MapPin className="w-4 h-4" />}>
          {bus.routeAssignments.length > 0 ? (
            bus.routeAssignments.map(r => (
              <div key={r.routeId} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded font-mono">
                    {r.routeNumber}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{r.routeName}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {r.origin} → {r.destination}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Permit: <span className="font-mono">{r.permitNumber}</span></p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic py-2">No route assigned</p>
          )}
        </Section>
      </div>

      {/* Facilities */}
      {enabledFacilities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Facilities & Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {enabledFacilities.map(f => (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full"
              >
                <CheckCircle className="w-3 h-3" />
                {f}
              </span>
            ))}
          </div>
          {bus.facilities.emergencyExits > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Emergency exits: {bus.facilities.emergencyExits}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
