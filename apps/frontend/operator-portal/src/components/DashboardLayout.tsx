import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bus, Users, Route as RouteIcon, Ticket, BarChart3, Wallet, FileCheck, LayoutDashboard, LogOut } from 'lucide-react';
import { Button, cn, ThemeSwitcher, ThemePersonalitySwitcher } from '@busmate/ui';
import { useAuth } from '@busmate/portal-shared';
import { PageProvider, usePageContext, usePageActionsValue } from '@/context/PageContext';

// Operator portal shell: sidebar + top bar + routed content. Pages declare their
// header title/description/actions via PageContext (useSetPageMetadata /
// useSetPageActions) exactly as they did in management-portal, so ported pages
// work unchanged.
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

function ContentHeader({ onLogout }: { onLogout: () => void }) {
  const { metadata } = usePageContext();
  const actions = usePageActionsValue();
  const { user } = useAuth();

  return (
    <header className="border-b bg-background px-6 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold truncate">{metadata.title}</h1>
        {metadata.description && (
          <p className="text-sm text-muted-foreground truncate">{metadata.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {/* Color theme (Default/Ocean/Slate) + light/dark toggle — same
            @busmate/ui switchers management-portal uses. */}
        <ThemePersonalitySwitcher />
        <ThemeSwitcher />
        <span className="text-sm text-muted-foreground hidden md:inline ml-1">
          {user?.fullName || user?.username}
        </span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </header>
  );
}

export function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <PageProvider>
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
          <ContentHeader onLogout={handleLogout} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </PageProvider>
  );
}
