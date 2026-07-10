'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@busmate/ui';
import { User, Mail, AtSign, Phone, Pencil, Save, X } from 'lucide-react';
import { formatProfileFieldLabel } from '@/data/admin/users';
import type { UpdateUserRequest, UserResponse } from '@/lib/api/adminUsers';

interface ProfileInfoCardProps {
  user: UserResponse;
  requiredProfileFields: string[];
  saving: boolean;
  onSave: (core: UpdateUserRequest, profilePatch?: Record<string, string>) => Promise<boolean>;
  iconClassName?: string;
}

export function ProfileInfoCard({
  user,
  requiredProfileFields,
  saving,
  onSave,
  iconClassName = 'text-primary',
}: ProfileInfoCardProps) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  const profileFields = Array.from(
    new Set([...requiredProfileFields, ...Object.keys(user.profileData ?? {})]),
  );

  useEffect(() => {
    if (!editing) {
      setFullName(user.fullName ?? '');
      setUsername(user.username ?? '');
      setPhoneNumber(user.phoneNumber ?? '');
      const initialProfile: Record<string, string> = {};
      profileFields.forEach((field) => {
        initialProfile[field] = String(user.profileData?.[field] ?? '');
      });
      setProfileValues(initialProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, editing]);

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    const ok = await onSave(
      { fullName, username, phoneNumber } satisfies UpdateUserRequest,
      profileFields.length > 0 ? profileValues : undefined,
    );
    if (ok) setEditing(false);
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <User className={`w-4 h-4 ${iconClassName}`} />
          Personal Information
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-5">
        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={user.fullName || 'Not provided'} />
            <Field label="Email Address" value={user.email || 'Not provided'} icon={<Mail className="w-3.5 h-3.5 text-muted-foreground/70" />} />
            <Field label="Username" value={user.username || 'N/A'} />
            <Field label="Phone" value={user.phoneNumber || 'Not provided'} icon={<Phone className="w-3.5 h-3.5 text-muted-foreground/70" />} />
            {profileFields.map((field) => (
              <Field
                key={field}
                label={formatProfileFieldLabel(field)}
                value={String(user.profileData?.[field] ?? 'Not provided')}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-fullName">Full Name</Label>
                <Input id="profile-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-username">Username</Label>
                <Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-muted-foreground">Email Address</Label>
                <Input id="profile-email" value={user.email ?? ''} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+94 XX XXX XXXX"
                  disabled={saving}
                />
              </div>
              {profileFields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`profile-${field}`}>{formatProfileFieldLabel(field)}</Label>
                  <Input
                    id={`profile-${field}`}
                    value={profileValues[field] ?? ''}
                    onChange={(e) => setProfileValues((prev) => ({ ...prev, [field]: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AtSign className="w-3 h-3" />
              Email can&apos;t be changed here — it&apos;s tied to your account&apos;s identity.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}
