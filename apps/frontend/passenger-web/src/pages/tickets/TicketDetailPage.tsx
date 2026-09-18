import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  ArrowLeft,
  Armchair,
  Bus,
  Calendar,
  Clock,
  Download,
  Loader2,
  MapPin,
  Share2,
  Ticket as TicketIcon,
  User,
} from "lucide-react";
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
import { useAuth } from "@/lib/auth/AuthContext";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import type { ConductorLogTicketDTO } from "@busmate/api-client-ticketing";
import { BusManagementService, BusStopManagementService, TripManagementService } from "@busmate/api-client-core";
import type { TripResponse } from "@busmate/api-client-core";

/** Bookings a passenger may still withdraw themselves - a paid ticket needs a real refund
 * process (out of scope, see INC-011's product decision), so it routes to support instead. */
const CANCELLABLE_STATUSES = new Set(["PENDING_PAYMENT", "PAYMENT_FAILED"]);

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-600",
  BOARDED: "bg-blue-600",
  PENDING_PAYMENT: "bg-amber-500",
  PAYMENT_FAILED: "bg-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

function formatTime(t?: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${period}`;
}

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<ConductorLogTicketDTO | null>(null);
  const [trip, setTrip] = useState<TripResponse | null>(null);
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

      // Best-effort display data for the raw IDs the ticket contract carries - a failure in any
      // one of these (e.g. a stop was since removed) must never block showing the ticket itself.
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
      // The ticket contract carries no departure date/time at all - resolved separately from
      // the trip itself, same best-effort pattern as the stop/bus lookups above.
      if (result.tripId) {
        TripManagementService.getTripById(result.tripId)
          .then((t) => setTrip(t))
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

  const handleShare = async () => {
    const shareData = {
      title: `BusMate ticket #${ticket?.ticketId}`,
      text: `${fromStopName ?? ticket?.startLocationId} → ${toStopName ?? ticket?.endLocationId}, seat ${ticket?.seatNumber}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Cancelled by the user - not an error worth surfacing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ticket link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const canCancel = ticket?.bookingStatus && CANCELLABLE_STATUSES.has(ticket.bookingStatus);
  const isPaidAndUncancellable = ticket?.bookingStatus === "CONFIRMED" || ticket?.bookingStatus === "BOARDED";
  const isBoardable = ticket?.bookingStatus === "CONFIRMED" || ticket?.bookingStatus === "BOARDED";

  // Real data only - a QR a passenger could forge client-side (a fake seat, a fake fare) is a
  // false sense of security, not a feature. Everything here is exactly what the server already
  // vouches for; the conductor's scanner still validates the ticket ID against the real backend
  // regardless of anything else this payload carries.
  const qrPayload = ticket
    ? JSON.stringify({
        ticketId: ticket.ticketId,
        passengerName: user?.fullName ?? "Passenger",
        startStation: fromStopName ?? ticket.startLocationId,
        endStation: toStopName ?? ticket.endLocationId,
        seatNumber: ticket.seatNumber,
        passengerCount: ticket.passengerCount ?? 1,
        ticketFee: ticket.fareAmount,
        paymentStatus: ticket.bookingStatus,
        tripDate: trip?.tripDate,
        departureTime: trip?.scheduledDepartureTime,
        busPlateNumber: busPlateNumber ?? undefined,
      })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-lg print:py-4 print:max-w-full">
        <Button variant="ghost" onClick={() => navigate("/tickets")} className="mb-4 -ml-2 print:hidden">
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
          <>
            <Card className="overflow-hidden print:shadow-none print:border-2">
              {/* Ticket header - a boarding-pass strip, not just a form field list */}
              <div className="bg-gradient-primary text-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5" />
                    <span className="font-semibold">BusMate Ticket</span>
                  </div>
                  <Badge className={`${STATUS_STYLES[ticket.bookingStatus ?? ""] ?? ""} border-0`}>
                    {ticket.bookingStatus}
                  </Badge>
                </div>
                <p className="text-2xl font-bold leading-tight">
                  {fromStopName ?? ticket.startLocationId ?? "—"}
                  <span className="mx-2 opacity-70">→</span>
                  {toStopName ?? ticket.endLocationId ?? "—"}
                </p>
                {(trip?.routeName || trip?.operatorName) && (
                  <p className="text-sm opacity-90 mt-1">
                    {trip?.routeName}
                    {trip?.operatorName ? ` · ${trip.operatorName}` : ""}
                  </p>
                )}
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Departure - the one thing every previous version of this ticket omitted */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Travel date</p>
                      <p className="text-sm font-medium">{formatDate(trip?.tripDate) ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departure</p>
                      <p className="text-sm font-medium">{formatTime(trip?.scheduledDepartureTime) ?? "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Armchair className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Seat</p>
                      <p className="text-sm font-medium">{ticket.seatNumber ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bus className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bus</p>
                      <p className="text-sm font-medium">{busPlateNumber ?? ticket.busId ?? "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passenger</p>
                    <p className="text-sm font-medium">{user?.fullName ?? "—"}</p>
                  </div>
                </div>

                {/* Tear line - a real ticket-stub cue, not just a horizontal rule */}
                <div className="relative py-2">
                  <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-background border" />
                  <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-background border" />
                  <div className="border-t border-dashed" />
                </div>

                {/* QR - what the conductor actually scans to board this ticket */}
                {isBoardable ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="p-3 bg-white rounded-lg border">
                      <QRCodeSVG value={qrPayload} size={168} level="M" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Show this to the conductor to board
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    A boarding QR code appears here once this ticket is paid and confirmed.
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Fare paid</span>
                  <span className="text-xl font-bold">LKR {(ticket.fareAmount ?? 0).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Booking ref #{ticket.ticketId}</span>
                  {ticket.paymentMethod && <span>Paid via {ticket.paymentMethod}</span>}
                </div>
                {ticket.issuedAt && (
                  <p className="text-xs text-muted-foreground -mt-3">
                    Booked {new Date(ticket.issuedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4 print:hidden">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" /> Print / Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
            </div>

            <div className="print:hidden">
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full mt-2" disabled={cancelling}>
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
                <p className="text-xs text-center text-muted-foreground mt-3">
                  This ticket is paid and can no longer be self-cancelled. Contact support for a refund.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
