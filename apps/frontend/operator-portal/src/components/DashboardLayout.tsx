import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bus, Users, Route as RouteIcon, Ticket, BarChart3, Wallet, FileCheck, LayoutDashboard, LogOut } from 'lucide-react';
import { Button, cn } from '@busmate/ui';
import { useAuth } from '@busmate/portal-shared';

// Operator portal shell: sidebar + top bar + routed content. The nav items map
// to the operator routes to be migrated; only Dashboard is wired so far, the
// rest are placeholders that render a "coming soon" page until migrated.
const NAV = [
  { to: '/operator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/operator/fleet', label: 'Fleet', icon: Bus },
  { to: '/operator/crew', label: 'Crew', icon: Users },
  { to: '/operator/trips', label: 'Trips', icon: RouteIcon },
  { to: '/operator/tickets', label: 'Tickets', icon: Ticket },
  { to: '/operator/revenue-analytics', label: 'Revenue', icon: BarChart3 },
  { to: '/operator/salaries', label: 'Salaries', icon: Wallet },
  { to: '/operator/passenger-permits', label: 'Permits', icon: FileCheck },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="h-16 flex items-center px-6 font-semibold text-lg border-b">BusMate Operator</div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
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
