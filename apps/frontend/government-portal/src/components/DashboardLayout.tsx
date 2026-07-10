import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bus, Route as RouteIcon, MapPin, CalendarClock,
  FileCheck, Ticket, BarChart3, ClipboardCheck, LogOut,
} from 'lucide-react';
import { Button, cn } from '@busmate/ui';
import { useAuth, normalizeRole } from '@busmate/portal-shared';

// Nav differs per government role. Only the dashboard link is wired so far;
// the rest are the routes to be migrated from management-portal's admin/,
// mot/, and timekeeper/ trees.
const NAV_BY_ROLE: Record<string, { to: string; label: string; icon: any }[]> = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/monitoring', label: 'Monitoring', icon: BarChart3 },
  ],
  mot: [
    { to: '/mot/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mot/routes', label: 'Routes', icon: RouteIcon },
    { to: '/mot/stops', label: 'Stops', icon: MapPin },
    { to: '/mot/schedules', label: 'Schedules', icon: CalendarClock },
    { to: '/mot/buses', label: 'Buses', icon: Bus },
    { to: '/mot/operators', label: 'Operators', icon: Users },
    { to: '/mot/permits', label: 'Permits', icon: FileCheck },
    { to: '/mot/tickets', label: 'Tickets', icon: Ticket },
  ],
  timekeeper: [
    { to: '/timekeeper/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/timekeeper/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/timekeeper/trips', label: 'Trips', icon: RouteIcon },
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = normalizeRole(user?.userType);
  const nav = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.admin;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="h-16 flex items-center px-6 font-semibold text-lg border-b">BusMate Gov</div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center justify-between px-6">
          <div className="text-sm text-muted-foreground">
            {user?.fullName || user?.username} · <span className="capitalize">{user?.userType}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
