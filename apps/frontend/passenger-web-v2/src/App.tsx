import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

/**
 * Scaffold shell for passenger-web-v2 (INC-063 phase 1). One placeholder route today,
 * proving the app boots and reaches the real api-gateway. Real routes (auth, find-bus,
 * booking, tickets, profile, contribute/steward) are added screen by screen in later
 * increments — see docs/ui/passenger-web-v2-design-reference.md and ADR-029.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
