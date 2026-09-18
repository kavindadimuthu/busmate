import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Armchair, Calendar, ChevronRight, Loader2, Ticket as TicketIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/AuthContext";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import type { ConductorLogTicketDTO } from "@busmate/api-client-ticketing";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-600",
  BOARDED: "bg-blue-600",
  PENDING_PAYMENT: "bg-amber-500",
  PAYMENT_FAILED: "bg-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

function statusLabel(status?: string): string {
  switch (status) {
    case "PENDING_PAYMENT": return "Awaiting payment";
    case "PAYMENT_FAILED": return "Payment failed";
    case "BOARDED": return "Boarded";
    case "CANCELLED": return "Cancelled";
    case "CONFIRMED": return "Confirmed";
    default: return status ?? "Unknown";
  }
}

/** A passenger's own bookings - server-enforced to be theirs alone since INC-011. */
export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ConductorLogTicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await TicketControllerService.getTicketsByPassengerId(user.userId!);
        if (!cancelled) {
          setTickets([...result].sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? "")));
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.body?.message || err?.message || "Could not load your tickets.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">My Tickets</h1>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && tickets.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>You haven't booked any tickets yet.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.ticketId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={STATUS_STYLES[ticket.bookingStatus ?? ""] ?? ""}>
                      {statusLabel(ticket.bookingStatus)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{ticket.ticketId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Armchair className="h-3.5 w-3.5" /> Seat {ticket.seatNumber ?? "—"}
                    </span>
                    {ticket.issuedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(ticket.issuedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">LKR {(ticket.fareAmount ?? 0).toFixed(2)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
