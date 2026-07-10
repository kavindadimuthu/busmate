import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@busmate/ui';
import { useAuth, normalizeRole } from '@busmate/portal-shared';

// Shared vertical-slice dashboard for admin/mot/timekeeper. Proves the full
// stack: authenticated staff session via the gateway BFF (httpOnly cookies),
// role-gated routing, shared @busmate/ui rendering. Real per-role widgets get
// ported in as the admin/mot/timekeeper page trees are migrated.
const HINT_BY_ROLE: Record<string, { label: string; hint: string }[]> = {
  admin: [
    { label: 'Total users', hint: 'Migrate from admin/users' },
    { label: 'Active sessions', hint: 'Migrate from admin/monitoring' },
    { label: 'System alerts', hint: 'Migrate from admin/notifications' },
    { label: 'Audit events', hint: 'Migrate from admin/logs' },
  ],
  mot: [
    { label: 'Routes', hint: 'Migrate from mot/routes' },
    { label: 'Operators', hint: 'Migrate from mot/operators' },
    { label: 'Trips today', hint: 'Migrate from mot/trips' },
    { label: 'Permits', hint: 'Migrate from mot/passenger-permits' },
  ],
  timekeeper: [
    { label: 'Present today', hint: 'Migrate from timekeeper/attendance' },
    { label: 'Trips logged', hint: 'Migrate from timekeeper/trips' },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.userType);
  const stats = HINT_BY_ROLE[role] ?? HINT_BY_ROLE.admin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.fullName || user?.username}</h1>
        <p className="text-muted-foreground capitalize">
          {role} dashboard · signed in via the gateway BFF (httpOnly cookies).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">—</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
