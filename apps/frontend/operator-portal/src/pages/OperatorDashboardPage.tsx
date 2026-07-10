import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@busmate/ui';
import { useAuth } from '@busmate/portal-shared';

// Vertical-slice dashboard. Proves the full stack end-to-end: authenticated
// operator session (httpOnly cookies via the gateway BFF), role-gated routing,
// shared @busmate/ui rendering with the BusMate design tokens. Real operator
// widgets (fleet counts, upcoming trips, revenue) get ported in here next.
export default function OperatorDashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Active buses', value: '—', hint: 'Migrate from operator/fleet' },
    { label: 'Crew members', value: '—', hint: 'Migrate from operator/crew' },
    { label: 'Trips today', value: '—', hint: 'Migrate from operator/trips' },
    { label: 'Revenue (30d)', value: '—', hint: 'Migrate from operator/revenue-analytics' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.fullName || user?.username}</h1>
        <p className="text-muted-foreground">Operator dashboard · signed in via the gateway BFF (httpOnly cookies).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
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
