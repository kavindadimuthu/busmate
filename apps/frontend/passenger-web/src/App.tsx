import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { BookingProvider } from "@/lib/booking/BookingContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import FindMyBusPage from "./pages/FindMyBusPage";
import FindMyBusDetailPage from "./pages/FindMyBusDetailPage";
import RoutesPage from "./pages/RoutesPage";
import RouteDetailPage from "./pages/RouteDetailPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import BookingReviewPage from "./pages/booking/BookingReviewPage";
import PaymentProcessingPage from "./pages/booking/PaymentProcessingPage";
import BookingSuccessPage from "./pages/booking/BookingSuccessPage";
import PayHereReturnPage from "./pages/booking/PayHereReturnPage";
import PayHereCancelPage from "./pages/booking/PayHereCancelPage";
import MyTicketsPage from "./pages/tickets/MyTicketsPage";
import TicketDetailPage from "./pages/tickets/TicketDetailPage";
import ContributeProgrammePage from "./pages/contribute/ContributeProgrammePage";
import ContributeApplyPage from "./pages/contribute/ContributeApplyPage";
import ProposeStopPage from "./pages/contribute/ProposeStopPage";
import MyContributionsPage from "./pages/contribute/MyContributionsPage";
import ContributionDetailPage from "./pages/contribute/ContributionDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BookingProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/findmybus" element={<FindMyBusPage />} />
              <Route path="/findmybus/detail" element={<FindMyBusDetailPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/routes/:id" element={<RouteDetailPage />} />
              <Route path="/contribute" element={<ContributeProgrammePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              {/* PayHere redirects the passenger's browser here directly (ADR-014) - these two
                  must not require login again on return, since the session should already be
                  live from before checkout; ProtectedRoute would otherwise bounce an expired
                  session to /login and lose the order_id context. */}
              <Route path="/booking/payhere-return" element={<PayHereReturnPage />} />
              <Route path="/booking/payhere-cancel" element={<PayHereCancelPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/booking/seats" element={<SeatSelectionPage />} />
                <Route path="/booking/review" element={<BookingReviewPage />} />
                <Route path="/booking/payment" element={<PaymentProcessingPage />} />
                <Route path="/booking/success" element={<BookingSuccessPage />} />
                <Route path="/tickets" element={<MyTicketsPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/contribute/apply" element={<ContributeApplyPage />} />
                <Route path="/contribute/propose" element={<ProposeStopPage />} />
                <Route path="/contribute/mine" element={<MyContributionsPage />} />
                <Route path="/contribute/mine/:id" element={<ContributionDetailPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BookingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
