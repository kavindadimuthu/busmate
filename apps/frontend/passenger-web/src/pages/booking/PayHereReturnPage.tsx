import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/lib/booking/BookingContext";
import { TicketControllerService } from "@busmate/api-client-ticketing";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15; // ~30s - PayHere's own callback to /notify is what actually settles this

/**
 * Where PayHere's hosted checkout sends the browser back after the passenger pays
 * (ADR-014). PayHere's own page confirms success to the passenger already; this page's job is
 * to wait for the notify_url webhook to actually land and update the ticket, since that webhook -
 * not this return - is authoritative.
 *
 * Cannot be exercised end to end without a public tunnel and real sandbox credentials (INC-013
 * open question) - built and reachable, but its actual webhook race is untested until then.
 */
export default function PayHereReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingResult, clear } = useBooking();
  const [status, setStatus] = useState<"waiting" | "success" | "timeout" | "error">("waiting");

  const orderId = searchParams.get("order_id");
  const ticketId = bookingResult?.ticketIds[0];

  useEffect(() => {
    if (!ticketId) {
      // A page refresh here loses the in-memory booking context - not recoverable without a
      // server-side "look up my pending booking by order_id" endpoint, which is out of scope.
      // My Tickets still shows the real, current state either way.
      navigate("/tickets", { replace: true });
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await TicketControllerService.confirmPayment(ticketId);
        if (cancelled) return;
        if (result.paymentStatus === "SUCCESS") {
          setStatus("success");
          return;
        }
        if (result.paymentStatus === "FAILED") {
          setStatus("error");
          return;
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        return;
      }

      attempts += 1;
      if (attempts >= MAX_POLLS) {
        if (!cancelled) setStatus("timeout");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [ticketId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {status === "waiting" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">Confirming your payment with PayHere...</p>
                {orderId && <p className="text-xs text-muted-foreground mt-1">Order {orderId}</p>}
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="font-medium mb-4">Payment confirmed</p>
                <Button
                  className="bg-gradient-primary"
                  onClick={() => {
                    clear();
                    navigate("/tickets");
                  }}
                >
                  View my tickets
                </Button>
              </>
            )}
            {(status === "timeout" || status === "error") && (
              <>
                <AlertCircle className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                <p className="font-medium mb-1">
                  {status === "timeout" ? "Still waiting on PayHere" : "Something went wrong"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your ticket will show the real status once it updates - check My Tickets, or
                  contact support if this persists.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    clear();
                    navigate("/tickets");
                  }}
                >
                  View my tickets
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
