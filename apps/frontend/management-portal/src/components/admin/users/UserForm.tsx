'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Clock,
  Truck,
  CircleDot,
  Car,
  Users,
  Building2,
  Hash,
  Briefcase,
  Route,
  Star,
  CreditCard,
  Plus,
} from 'lucide-react';
import {
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  getUserDisplayName,
} from '@/data/admin/users';
import type {
  SystemUser,
  UserType,
  UserStatus,
  MOTUser,
  TimekeeperUser,
  OperatorUser,
  ConductorUser,
  DriverUser,
  PassengerUser,
} from '@/data/admin/users';

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: SystemUser | null;
  onSubmit: (data: Partial<SystemUser>) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function UserForm({
  mode,
  user,
  onSubmit,
  onCancel,
  loading = false,
}: UserFormProps) {
  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [address, setAddress] = useState('');
  const [userType, setUserType] = useState<UserType>('passenger');
  const [status, setStatus] = useState<UserStatus>('active');
  const [notes, setNotes] = useState('');

  // MOT fields
  const [employeeIdMot, setEmployeeIdMot] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [securityClearance, setSecurityClearance] = useState<'basic' | 'standard' | 'enhanced' | 'top-secret'>('basic');
  const [permissions, setPermissions] = useState<string[]>([]);

  // Timekeeper fields
  const [employeeIdTk, setEmployeeIdTk] = useState('');
  const [assignedTerminal, setAssignedTerminal] = useState('');
  const [assignedRouteTk, setAssignedRouteTk] = useState('');
  const [shift, setShift] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // Operator fields
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [operatorLicense, setOperatorLicense] = useState('');
  const [totalBuses, setTotalBuses] = useState(0);
  const [activeBuses, setActiveBuses] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);

  // Conductor fields
  const [employeeIdCond, setEmployeeIdCond] = useState('');
  const [assignedBusCond, setAssignedBusCond] = useState('');
  const [assignedRouteCond, setAssignedRouteCond] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [totalTripsCond, setTotalTripsCond] = useState(0);
  const [ratingCond, setRatingCond] = useState(0);

  // Driver fields
  const [employeeIdDrv, setEmployeeIdDrv] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState('');
  const [vehicleClasses, setVehicleClasses] = useState<string[]>([]);
  const [assignedBusDrv, setAssignedBusDrv] = useState('');
  const [assignedRouteDrv, setAssignedRouteDrv] = useState('');
  const [operatorIdDrv, setOperatorIdDrv] = useState('');
  const [operatorNameDrv, setOperatorNameDrv] = useState('');
  const [totalTripsDrv, setTotalTripsDrv] = useState(0);
  const [ratingDrv, setRatingDrv] = useState(0);

  // Passenger fields
  const [totalTripsPass, setTotalTripsPass] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
  const [preferredPayment, setPreferredPayment] = useState('cash');

  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form for edit mode
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setPhone(user.phone);
      setNic(user.nic);
      setAddress(user.address);
      setUserType(user.userType);
      setStatus(user.status);
      setNotes(user.notes || '');

      switch (user.userType) {
        case 'mot': {
          const m = user as MOTUser;
          setEmployeeIdMot(m.employeeId);
          setDepartment(m.department);
          setDesignation(m.designation);
          setOfficeLocation(m.officeLocation);
          setSecurityClearance(m.securityClearance);
          setPermissions([...m.permissions]);
          break;
        }
        case 'timekeeper': {
          const t = user as TimekeeperUser;
          setEmployeeIdTk(t.employeeId);
          setAssignedTerminal(t.assignedTerminal);
          setAssignedRouteTk(t.assignedRoute);
          setShift(t.shift);
          setSupervisor(t.supervisor);
          break;
        }
        case 'operator': {
          const o = user as OperatorUser;
          setCompanyName(o.companyName);
          setRegistrationNumber(o.registrationNumber);
          setOperatorLicense(o.operatorLicense);
          setTotalBuses(o.totalBuses);
          setActiveBuses(o.activeBuses);
          setTotalRoutes(o.totalRoutes);
          break;
        }
        case 'conductor': {
          const c = user as ConductorUser;
          setEmployeeIdCond(c.employeeId);
          setAssignedBusCond(c.assignedBus);
          setAssignedRouteCond(c.assignedRoute);
          setOperatorId(c.operatorId);
          setOperatorName(c.operatorName);
          setLicenseNumber(c.licenseNumber);
          setTotalTripsCond(c.totalTrips);
          setRatingCond(c.rating);
          break;
        }
        case 'driver': {
          const d = user as DriverUser;
          setEmployeeIdDrv(d.employeeId);
          setDrivingLicenseNumber(d.drivingLicenseNumber);
          setDrivingLicenseExpiry(d.drivingLicenseExpiry);
          setVehicleClasses([...d.vehicleClasses]);
          setAssignedBusDrv(d.assignedBus);
          setAssignedRouteDrv(d.assignedRoute);
          setOperatorIdDrv(d.operatorId);
          setOperatorNameDrv(d.operatorName);
          setTotalTripsDrv(d.totalTrips);
          setRatingDrv(d.rating);
          break;
        }
        case 'passenger': {
          const p = user as PassengerUser;
          setTotalTripsPass(p.totalTrips);
          setTotalSpent(p.totalSpent);
          setWalletBalance(p.walletBalance);
          setSavedRoutes([...p.savedRoutes]);
          setPreferredPayment(p.preferredPayment);
          break;
        }
      }
    }
  }, [mode, user]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!nic.trim()) newErrors.nic = 'NIC is required';

    // Type-specific validations
    if (userType === 'mot') {
      if (!employeeIdMot.trim()) newErrors.employeeIdMot = 'Employee ID is required';
      if (!department.trim()) newErrors.department = 'Department is required';
    }
    if (userType === 'timekeeper') {
      if (!employeeIdTk.trim()) newErrors.employeeIdTk = 'Employee ID is required';
    }
    if (userType === 'operator') {
      if (!companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    }
    if (userType === 'conductor') {
      if (!employeeIdCond.trim()) newErrors.employeeIdCond = 'Employee ID is required';
    }
    if (userType === 'driver') {
      if (!employeeIdDrv.trim()) newErrors.employeeIdDrv = 'Employee ID is required';
      if (!drivingLicenseNumber.trim()) newErrors.drivingLicenseNumber = 'License number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const baseData: Partial<SystemUser> = {
      firstName,
      lastName,
      email,
      phone,
      nic,
      address,
      userType,
      status,
      notes: notes || undefined,
      lastLogin: mode === 'create' ? null : user?.lastLogin ?? null,
    };

    let typeData: Record<string, unknown> = {};

    switch (userType) {
      case 'mot':
        typeData = {
          employeeId: employeeIdMot,
          department,
          designation,
          officeLocation,
          securityClearance,
          permissions,
        };
        break;
      case 'timekeeper':
        typeData = {
          employeeId: employeeIdTk,
          assignedTerminal,
          assignedRoute: assignedRouteTk,
          shift,
          supervisor,
        };
        break;
      case 'operator':
        typeData = {
          companyName,
          registrationNumber,
          operatorLicense,
          totalBuses,
          activeBuses,
          totalRoutes,
        };
        break;
      case 'conductor':
        typeData = {
          employeeId: employeeIdCond,
          assignedBus: assignedBusCond,
          assignedRoute: assignedRouteCond,
          operatorId,
          operatorName,
          licenseNumber,
          totalTrips: totalTripsCond,
          rating: ratingCond,
        };
        break;
      case 'driver':
        typeData = {
          employeeId: employeeIdDrv,
          drivingLicenseNumber,
          drivingLicenseExpiry,
          vehicleClasses,
          assignedBus: assignedBusDrv,
          assignedRoute: assignedRouteDrv,
          operatorId: operatorIdDrv,
          operatorName: operatorNameDrv,
          totalTrips: totalTripsDrv,
          rating: ratingDrv,
        };
        break;
      case 'passenger':
        typeData = {
          totalTrips: totalTripsPass,
          totalSpent,
          walletBalance,
          savedRoutes,
          preferredPayment,
        };
        break;
    }

    onSubmit({ ...baseData, ...typeData } as Partial<SystemUser>);
  };

  const InputField = ({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    icon,
  }: {
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    error,
    required = false,
    disabled = false,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    error?: string;
    required?: boolean;
    disabled?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );

  const availablePermissions = [
    'route_management',
    'schedule_management',
    'operator_management',
    'analytics',
    'permits',
    'inspections',
    'user_management',
    'system_settings',
  ];

  const availableVehicleClasses = ['A', 'A1', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'G'];

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'edit' ? 'Back to User' : 'Back to Users'}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Create User' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                error={errors.firstName}
                placeholder="Enter first name"
                required
                icon={<User className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Last Name"
                value={lastName}
                onChange={setLastName}
                error={errors.lastName}
                placeholder="Enter last name"
                required
                icon={<User className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                type="email"
                placeholder="user@example.com"
                required
                icon={<Mail className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Phone"
                value={phone}
                onChange={setPhone}
                error={errors.phone}
                placeholder="+94 XX XXX XXXX"
                required
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <InputField
                label="NIC / Registration No."
                value={nic}
                onChange={setNic}
                error={errors.nic}
                placeholder="Enter NIC number"
                required
                icon={<FileText className="h-3.5 w-3.5" />}
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Enter full address"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Account Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="User Type"
                value={userType}
                onChange={(v) => setUserType(v as UserType)}
                options={Object.entries(USER_TYPE_CONFIG).map(([key, cfg]) => ({
                  value: key,
                  label: cfg.label,
                }))}
                required
                disabled={mode === 'edit'}
              />
              <SelectField
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as UserStatus)}
                options={Object.entries(USER_STATUS_CONFIG).map(([key, cfg]) => ({
                  value: key,
                  label: cfg.label,
                }))}
                required
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificForm(userType, {
            // MOT
            employeeIdMot, setEmployeeIdMot,
            department, setDepartment,
            designation, setDesignation,
            officeLocation, setOfficeLocation,
            securityClearance, setSecurityClearance,
            permissions, setPermissions,
            availablePermissions,
            // Timekeeper
            employeeIdTk, setEmployeeIdTk,
            assignedTerminal, setAssignedTerminal,
            assignedRouteTk, setAssignedRouteTk,
            shift, setShift,
            supervisor, setSupervisor,
            // Operator
            companyName, setCompanyName,
            registrationNumber, setRegistrationNumber,
            operatorLicense, setOperatorLicense,
            totalBuses, setTotalBuses,
            activeBuses, setActiveBuses,
            totalRoutes, setTotalRoutes,
            // Conductor
            employeeIdCond, setEmployeeIdCond,
            assignedBusCond, setAssignedBusCond,
            assignedRouteCond, setAssignedRouteCond,
            operatorId, setOperatorId,
            operatorName, setOperatorName,
            licenseNumber, setLicenseNumber,
            totalTripsCond, setTotalTripsCond,
            ratingCond, setRatingCond,
            // Driver
            employeeIdDrv, setEmployeeIdDrv,
            drivingLicenseNumber, setDrivingLicenseNumber,
            drivingLicenseExpiry, setDrivingLicenseExpiry,
            vehicleClasses, setVehicleClasses,
            assignedBusDrv, setAssignedBusDrv,
            assignedRouteDrv, setAssignedRouteDrv,
            operatorIdDrv, setOperatorIdDrv,
            operatorNameDrv, setOperatorNameDrv,
            totalTripsDrv, setTotalTripsDrv,
            ratingDrv, setRatingDrv,
            availableVehicleClasses,
            // Passenger
            totalTripsPass, setTotalTripsPass,
            totalSpent, setTotalSpent,
            walletBalance, setWalletBalance,
            savedRoutes, setSavedRoutes,
            preferredPayment, setPreferredPayment,
            // Shared
            errors,
            loading,
            toggleArrayItem,
            InputField,
            SelectField,
          })}

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this user..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 resize-none"
            />
          </div>
        </div>

        {/* Sidebar Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold mb-3">
                {(firstName?.[0] || '?')}{(lastName?.[0] || '?')}
              </div>
              <p className="font-semibold text-gray-900">
                {userType === 'operator' && companyName
                  ? companyName
                  : `${firstName || 'First'} ${lastName || 'Last'}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{email || 'email@example.com'}</p>
              <div className="flex items-center gap-2 mt-3">
                {userType && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${USER_TYPE_CONFIG[userType].bgColor} ${USER_TYPE_CONFIG[userType].color} ${USER_TYPE_CONFIG[userType].borderColor}`}>
                    {USER_TYPE_CONFIG[userType].label}
                  </span>
                )}
                {status && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${USER_STATUS_CONFIG[status].bgColor} ${USER_STATUS_CONFIG[status].color} ${USER_STATUS_CONFIG[status].borderColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${USER_STATUS_CONFIG[status].dotColor}`} />
                    {USER_STATUS_CONFIG[status].label}
                  </span>
                )}
              </div>
              {phone && (
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTypeSpecificForm(userType: UserType, ctx: any) {
  const { InputField, SelectField, errors, loading, toggleArrayItem } = ctx;

  switch (userType) {
    case 'mot':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            MOT Officer Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Employee ID"
              value={ctx.employeeIdMot}
              onChange={ctx.setEmployeeIdMot}
              error={errors.employeeIdMot}
              placeholder="MOT-XXXX"
              required
            />
            <InputField
              label="Department"
              value={ctx.department}
              onChange={ctx.setDepartment}
              error={errors.department}
              placeholder="e.g., Route Management"
              required
            />
            <InputField
              label="Designation"
              value={ctx.designation}
              onChange={ctx.setDesignation}
              placeholder="e.g., Senior Transport Officer"
            />
            <InputField
              label="Office Location"
              value={ctx.officeLocation}
              onChange={ctx.setOfficeLocation}
              placeholder="e.g., Ministry of Transport - Colombo"
            />
            <SelectField
              label="Security Clearance"
              value={ctx.securityClearance}
              onChange={ctx.setSecurityClearance}
              options={[
                { value: 'basic', label: 'Basic' },
                { value: 'standard', label: 'Standard' },
                { value: 'enhanced', label: 'Enhanced' },
                { value: 'top-secret', label: 'Top Secret' },
              ]}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {ctx.availablePermissions.map((perm: string) => (
                <button
                  key={perm}
                  type="button"
                  onClick={() => toggleArrayItem(ctx.permissions, perm, ctx.setPermissions)}
                  disabled={loading}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    ctx.permissions.includes(perm)
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {perm.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'timekeeper':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            Timekeeper Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Employee ID"
              value={ctx.employeeIdTk}
              onChange={ctx.setEmployeeIdTk}
              error={errors.employeeIdTk}
              placeholder="TK-XXXX"
              required
            />
            <InputField
              label="Assigned Terminal"
              value={ctx.assignedTerminal}
              onChange={ctx.setAssignedTerminal}
              placeholder="e.g., Colombo Fort Bus Terminal"
            />
            <InputField
              label="Assigned Route"
              value={ctx.assignedRouteTk}
              onChange={ctx.setAssignedRouteTk}
              placeholder="e.g., Colombo - Kandy (Route 1)"
            />
            <InputField
              label="Shift"
              value={ctx.shift}
              onChange={ctx.setShift}
              placeholder="e.g., 6:00 AM - 2:00 PM"
            />
            <InputField
              label="Supervisor"
              value={ctx.supervisor}
              onChange={ctx.setSupervisor}
              placeholder="Supervisor name"
            />
          </div>
        </div>
      );

    case 'operator':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-orange-600" />
            Operator Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Company Name"
                value={ctx.companyName}
                onChange={ctx.setCompanyName}
                error={errors.companyName}
                placeholder="e.g., Lanka Express Transport (Pvt) Ltd"
                required
              />
            </div>
            <InputField
              label="Registration Number"
              value={ctx.registrationNumber}
              onChange={ctx.setRegistrationNumber}
              error={errors.registrationNumber}
              placeholder="PV-XXXXX"
              required
            />
            <InputField
              label="Operator License"
              value={ctx.operatorLicense}
              onChange={ctx.setOperatorLicense}
              placeholder="OL-XXXX-XXXX"
            />
            <InputField
              label="Total Buses"
              value={ctx.totalBuses}
              onChange={(v: string) => ctx.setTotalBuses(parseInt(v) || 0)}
              type="number"
            />
            <InputField
              label="Active Buses"
              value={ctx.activeBuses}
              onChange={(v: string) => ctx.setActiveBuses(parseInt(v) || 0)}
              type="number"
            />
            <InputField
              label="Total Routes"
              value={ctx.totalRoutes}
              onChange={(v: string) => ctx.setTotalRoutes(parseInt(v) || 0)}
              type="number"
            />
          </div>
        </div>
      );

    case 'conductor':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-green-600" />
            Conductor Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Employee ID"
              value={ctx.employeeIdCond}
              onChange={ctx.setEmployeeIdCond}
              error={errors.employeeIdCond}
              placeholder="COND-XXXX"
              required
            />
            <InputField
              label="License Number"
              value={ctx.licenseNumber}
              onChange={ctx.setLicenseNumber}
              placeholder="CLIC-XXXX-XXXX"
            />
            <InputField
              label="Assigned Bus"
              value={ctx.assignedBusCond}
              onChange={ctx.setAssignedBusCond}
              placeholder="e.g., NB-1234"
            />
            <InputField
              label="Assigned Route"
              value={ctx.assignedRouteCond}
              onChange={ctx.setAssignedRouteCond}
              placeholder="e.g., Colombo - Kandy"
            />
            <InputField
              label="Operator ID"
              value={ctx.operatorId}
              onChange={ctx.setOperatorId}
              placeholder="USR-XXX"
            />
            <InputField
              label="Operator Name"
              value={ctx.operatorName}
              onChange={ctx.setOperatorName}
              placeholder="Operator name"
            />
          </div>
        </div>
      );

    case 'driver':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-600" />
            Driver Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Employee ID"
              value={ctx.employeeIdDrv}
              onChange={ctx.setEmployeeIdDrv}
              error={errors.employeeIdDrv}
              placeholder="DRV-XXXX"
              required
            />
            <InputField
              label="Driving License Number"
              value={ctx.drivingLicenseNumber}
              onChange={ctx.setDrivingLicenseNumber}
              error={errors.drivingLicenseNumber}
              placeholder="DL-XXXXX-XXXX"
              required
            />
            <InputField
              label="License Expiry"
              value={ctx.drivingLicenseExpiry}
              onChange={ctx.setDrivingLicenseExpiry}
              type="date"
            />
            <InputField
              label="Assigned Bus"
              value={ctx.assignedBusDrv}
              onChange={ctx.setAssignedBusDrv}
              placeholder="e.g., NB-1234"
            />
            <InputField
              label="Assigned Route"
              value={ctx.assignedRouteDrv}
              onChange={ctx.setAssignedRouteDrv}
              placeholder="e.g., Colombo - Kandy"
            />
            <InputField
              label="Operator ID"
              value={ctx.operatorIdDrv}
              onChange={ctx.setOperatorIdDrv}
              placeholder="USR-XXX"
            />
            <InputField
              label="Operator Name"
              value={ctx.operatorNameDrv}
              onChange={ctx.setOperatorNameDrv}
              placeholder="Operator name"
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Vehicle Classes</label>
            <div className="flex flex-wrap gap-2">
              {ctx.availableVehicleClasses.map((cls: string) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleArrayItem(ctx.vehicleClasses, cls, ctx.setVehicleClasses)}
                  disabled={loading}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                    ctx.vehicleClasses.includes(cls)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'passenger':
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Passenger Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Wallet Balance (Rs)"
              value={ctx.walletBalance}
              onChange={(v: string) => ctx.setWalletBalance(parseFloat(v) || 0)}
              type="number"
            />
            <SelectField
              label="Preferred Payment"
              value={ctx.preferredPayment}
              onChange={ctx.setPreferredPayment}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'wallet', label: 'Wallet' },
              ]}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
