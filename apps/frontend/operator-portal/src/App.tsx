import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ThemePersonalityProvider } from '@busmate/ui';
import { AuthProvider, ProtectedRoute } from '@busmate/portal-shared';
import { DashboardLayout } from '@/components/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import OperatorDashboardPage from '@/pages/OperatorDashboardPage';
import FleetPage from '@/pages/operator/FleetPage';
import CrewPage from '@/pages/operator/CrewPage';
import NotAuthorizedPage from '@/pages/NotAuthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Operator portal route tree. New operator pages (fleet, crew, trips, tickets,
// revenue, salaries, permits, profile) get added as <Route> children under the
// protected DashboardLayout below — the same mechanical page-by-page migration
// the plan describes, now that auth + routing are proven.
export default function App() {
  return (
    // Dark/light mode (next-themes → class="dark" on <html>) + BusMate color
    // themes (ThemePersonalityProvider → data-theme="default|ocean|slate"),
    // same design-system setup as management-portal.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ThemePersonalityProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />

          {/* Everything below requires an authenticated operator session. */}
          <Route element={<ProtectedRoute portal="operator" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/operator/dashboard" element={<OperatorDashboardPage />} />
              <Route path="/operator/fleet" element={<FleetPage />} />
              <Route path="/operator/crew" element={<CrewPage />} />
              {/* TODO(migration): add trips, tickets, revenue-analytics,
                  salaries, passenger-permits, profile routes here. */}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/operator/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemePersonalityProvider>
    </ThemeProvider>
  );
}
