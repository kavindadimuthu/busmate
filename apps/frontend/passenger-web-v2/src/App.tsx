import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BookingProvider } from "@/lib/booking/BookingContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import RequireAuth from "@/components/auth/RequireAuth";
import LandingPage from "./pages/LandingPage";
import NotRebuiltPage from "./pages/NotRebuiltPage";

// The forms pull in zod and react-hook-form; only passengers who open them should download those.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const FindMyBusPage = lazy(() => import("./pages/FindMyBusPage"));
const TripDetailsPage = lazy(() => import("./pages/TripDetailsPage"));
const SeatSelectionPage = lazy(() => import("./pages/SeatSelectionPage"));
const BookingReviewPage = lazy(() => import("./pages/BookingReviewPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const BookingSuccessPage = lazy(() => import("./pages/BookingSuccessPage"));
const PayHereReturnPage = lazy(() => import("./pages/PayHereReturnPage"));
const ContributeProgrammePage = lazy(() => import("./pages/ContributeProgrammePage"));
const ContributeApplyPage = lazy(() => import("./pages/ContributeApplyPage"));
const MyContributionsPage = lazy(() => import("./pages/MyContributionsPage"));
const ContributionDetailPage = lazy(() => import("./pages/ContributionDetailPage"));
const ProposeStopPage = lazy(() => import("./pages/ProposeStopPage"));
const ProposeWorkingPage = lazy(() => import("./pages/ProposeWorkingPage"));
const CorrectWorkingPage = lazy(() => import("./pages/CorrectWorkingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const RouteDetailPage = lazy(() => import("./pages/RouteDetailPage"));
const MyTicketsPage = lazy(() => import("./pages/MyTicketsPage"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const PayHereCancelPage = lazy(() => import("./pages/PayHereCancelPage"));

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
        <ScrollToTop />
        <AuthProvider>
          <BookingProvider>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/findmybus" element={<FindMyBusPage />} />
              <Route path="/findmybus/detail" element={<TripDetailsPage />} />
              <Route path="/booking/seats" element={<RequireAuth notice="Log in to choose your seats."><SeatSelectionPage /></RequireAuth>} />
              <Route path="/booking/review" element={<RequireAuth notice="Log in to finish your booking."><BookingReviewPage /></RequireAuth>} />
              <Route path="/booking/payment" element={<RequireAuth notice="Log in to finish your booking."><PaymentPage /></RequireAuth>} />
              <Route path="/booking/success" element={<RequireAuth notice="Log in to see your booking."><BookingSuccessPage /></RequireAuth>} />
              {/* PayHere sends the browser back to these two addresses (ADR-014), the same ones passenger-web serves. */}
              <Route path="/booking/payhere-return" element={<RequireAuth notice="Log in to confirm your payment."><PayHereReturnPage /></RequireAuth>} />
              <Route path="/booking/payhere-cancel" element={<PayHereCancelPage />} />
              <Route path="/tickets" element={<RequireAuth notice="Log in to see your tickets."><MyTicketsPage /></RequireAuth>} />
              <Route path="/tickets/:id" element={<RequireAuth notice="Log in to see your ticket."><TicketDetailPage /></RequireAuth>} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/routes/:id" element={<RouteDetailPage />} />
              <Route path="/profile" element={<RequireAuth notice="Log in to see your profile."><ProfilePage /></RequireAuth>} />
              <Route path="/contribute" element={<ContributeProgrammePage />} />
              <Route path="/contribute/apply" element={<RequireAuth notice="Log in to apply to contribute."><ContributeApplyPage /></RequireAuth>} />
              <Route path="/contribute/mine" element={<RequireAuth notice="Log in to see your contributions."><MyContributionsPage /></RequireAuth>} />
              <Route path="/contribute/mine/:id" element={<RequireAuth notice="Log in to see your contributions."><ContributionDetailPage /></RequireAuth>} />
              <Route path="/contribute/propose" element={<RequireAuth notice="Log in to propose a stop."><ProposeStopPage /></RequireAuth>} />
              <Route path="/contribute/propose-working" element={<RequireAuth notice="Log in to say who runs a bus."><ProposeWorkingPage /></RequireAuth>} />
              <Route path="/contribute/correct-working" element={<RequireAuth notice="Log in to correct a bus's record."><CorrectWorkingPage /></RequireAuth>} />
              <Route path="*" element={<NotRebuiltPage />} />
            </Routes>
          </Suspense>
          </BookingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
