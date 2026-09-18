import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Armchair, Bus, Loader2, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import type { ConductorLogTicketDTO } from "@busmate/api-client-ticketing";
import { BusManagementService, BusStopManagementService } from "@busmate/api-client-core";

/** Bookings a passenger may still withdraw themselves - a paid ticket needs a real refund
 * process (out of scope, see INC-011's product decision), so it routes to support instead. */
const CANCELLABLE_STATUSES = new Set(["PENDING_PAYMENT", "PAYMENT_FAILED"]);

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ConductorLogTicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [fromStopName, setFromStopName] = useState<string | null>(null);
  const [toStopName, setToStopName] = useState<string | null>(null);
  const [busPlateNumber, setBusPlateNumber] = useState<string | null>(null);

  const loadTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await TicketControllerService.getTicketById(Number(id));
      setTicket(result);

      // Best-effort display names for the raw IDs the ticket contract carries - a failure here
      // (e.g. a stop was since removed) must never block showing the ticket itself.
      if (result.startLocationId) {
        BusStopManagementService.getStopById(result.startLocationId)
          .then((s) => setFromStopName(s.name ?? null))
          .catch(() => {});
      }
      if (result.endLocationId) {
        BusStopManagementService.getStopById(result.endLocationId)
          .then((s) => setToStopName(s.name ?? null))
          .catch(() => {});
      }
      if (result.busId) {
        BusManagementService.getBusById(result.busId)
          .then((b) => setBusPlateNumber(b.plateNumber ?? null))
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err?.body?.message || err?.message || "Could not load this ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!ticket?.ticketId) return;
    try {
      setCancelling(true);
      await TicketControllerService.cancelTicket(ticket.ticketId, { reason: "Cancelled by passenger" });
      toast.success("Booking cancelled");
      await loadTicket();
    } catch (err: any) {
      toast.error(err?.body?.message || err?.message || "Could not cancel this booking.");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = ticket?.bookingStatus && CANCELLABLE_STATUSES.has(ticket.bookingStatus);
  const isPaidAndUncancellable = ticket?.bookingStatus === "CONFIRMED" || ticket?.bookingStatus === "BOARDED";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-lg">
        <Button variant="ghost" onClick={() => navigate("/tickets")} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> My Tickets
        </Button>

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

        {!loading && ticket && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Ticket #{ticket.ticketId}</h1>
                <Badge>{ticket.bookingStatus}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm">
                    {fromStopName && toStopName
                      ? `${fromStopName} → ${toStopName}`
                      : ticket.startLocationId && ticket.endLocationId
                        ? `${ticket.startLocationId} → ${ticket.endLocationId}`
                        : "Route details unavailable"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Armchair className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm">Seat {ticket.seatNumber ?? "—"}</p>
                </div>
                <div className="flex items-start gap-3">
                  <Bus className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm">{busPlateNumber ?? ticket.busId ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Fare paid</span>
                <span className="text-xl font-bold">LKR {(ticket.fareAmount ?? 0).toFixed(2)}</span>
              </div>

              {ticket.paymentMethod && (
                <p className="text-xs text-muted-foreground">
                  Paid via {ticket.paymentMethod}{ticket.issuedAt ? ` · Booked ${new Date(ticket.issuedAt).toLocaleString()}` : ""}
                </p>
              )}

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={cancelling}>
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Cancel booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Seat {ticket.seatNumber} will be released for other passengers. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep booking</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>Yes, cancel</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isPaidAndUncancellable && (
                <p className="text-xs text-center text-muted-foreground">
                  This ticket is paid and can no longer be self-cancelled. Contact support for a refund.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
