'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@busmate/ui';
import { KeyRound } from 'lucide-react';
import type { UserPermissionsResponse } from '@/lib/api/adminUsers';

interface PermissionsCardProps {
  permissions: UserPermissionsResponse | null;
  iconClassName?: string;
}

export function PermissionsCard({ permissions, iconClassName = 'text-primary' }: PermissionsCardProps) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound className={`w-4 h-4 ${iconClassName}`} />
          My Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {permissions === null ? (
          <p className="text-sm text-muted-foreground">Unable to load permissions right now.</p>
        ) : permissions.effectivePermissions && permissions.effectivePermissions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {permissions.effectivePermissions.map((perm) => (
              <span
                key={perm}
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
              >
                {perm}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No permissions granted.</p>
        )}
        {permissions?.overrides && permissions.overrides.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Individual overrides</p>
            <div className="space-y-1.5">
              {permissions.overrides.map((override) => (
                <div key={override.permissionName} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{override.permissionName}</span>
                  <span className={override.isGranted ? 'text-success' : 'text-destructive'}>
                    {override.isGranted ? 'Granted' : 'Revoked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
