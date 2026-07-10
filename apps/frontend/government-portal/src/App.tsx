import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, ProtectedRoute } from '@busmate/portal-shared';
import { DashboardLayout } from '@/components/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NotAuthorizedPage from '@/pages/NotAuthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Government portal route tree — serves admin, mot (planner), and timekeeper.
// Auth + routing are proven by the shared slice; the per-role page trees
// (admin/*, mot/*, timekeeper/*) get migrated in under the protected layout,
// each guarded by the same ProtectedRoute (which already rejects operators).
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />

          <Route element={<ProtectedRoute portal="government" />}>
            <Route element={<DashboardLayout />}>
              {/* Each role lands on its own dashboard; one shared shell for now. */}
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/mot/dashboard" element={<DashboardPage />} />
              <Route path="/timekeeper/dashboard" element={<DashboardPage />} />
              {/* TODO(migration): admin/*, mot/*, timekeeper/* pages here. */}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
