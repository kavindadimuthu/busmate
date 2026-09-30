import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import LandingPage from "./pages/LandingPage";
import NotRebuiltPage from "./pages/NotRebuiltPage";

// The forms pull in zod and react-hook-form; only passengers who open them should download those.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const FindMyBusPage = lazy(() => import("./pages/FindMyBusPage"));
const TripDetailsPage = lazy(() => import("./pages/TripDetailsPage"));

const queryClient = new QueryClient();

const PageLoading = () => (
  <div role="status" aria-label="Loading" className="grid min-h-screen place-items-center">
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/findmybus" element={<FindMyBusPage />} />
              <Route path="/findmybus/detail" element={<TripDetailsPage />} />
              <Route path="*" element={<NotRebuiltPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
