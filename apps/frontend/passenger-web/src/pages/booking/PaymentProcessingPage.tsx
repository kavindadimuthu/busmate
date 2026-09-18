import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/lib/booking/BookingContext";
import { TicketControllerService } from "@busmate/api-client-ticketing";

/**
 * Splits into the two paths PaymentGateway can return (ADR-014):
 *
 * - checkoutFields present (PayHere, once enabled) → auto-submit a hidden form to PayHere's
 *   hosted checkout. The browser leaves this app; payhere-return.tsx picks it back up.
 * - checkoutFields absent (DummyPaymentGateway, today) → the booking already has a pending
 *   payment record with nothing external to wait for, so confirm it directly, exactly like
 *   passenger-mobile's proven booking flow does.
 *
 * No branch needs to change when the flag flips - the response shape already decided which one
 * runs.
 */
export default function PaymentProcessingPage() {
  const navigate = useNavigate();
  const { bookingResult, trip } = useBooking();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!bookingResult || !trip) {
      navigate("/findmybus", { replace: true });
      return;
    }

    if (bookingResult.checkoutFields && bookingResult.redirectUrl) {
      // Real PayHere checkout - submit the pre-built, pre-hashed form. React won't have rendered
      // it yet on the very first effect tick in some cases, so this runs after render via the ref.
      formRef.current?.submit();
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        // A short, real delay - not a fake progress bar - so "Processing..." isn't misleadingly
        // instant for what is, in dummy mode, actually an immediate confirm.
        await new Promise((resolve) => setTimeout(resolve, 900));
        const ticketId = bookingResult.ticketIds[0];
        await TicketControllerService.confirmPayment(ticketId);
        navigate("/booking/success", { replace: true });
      } catch (err: any) {
        setError(err?.body?.message || err?.message || "Payment could not be confirmed. Please try again.");
      }
    })();
  }, [bookingResult, trip, navigate]);

  if (!bookingResult) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {error ? (
              <>
                <Alert variant="destructive" className="mb-4 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => navigate("/tickets")}>
                  View my tickets
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">
                  {bookingResult.checkoutFields ? "Redirecting to PayHere..." : "Processing your payment..."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Please don't close this page.</p>
              </>
            )}
          </CardContent>
        </Card>

        {bookingResult.checkoutFields && bookingResult.redirectUrl && (
          <form ref={formRef} method="POST" action={bookingResult.redirectUrl} className="hidden">
            {Object.entries(bookingResult.checkoutFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
