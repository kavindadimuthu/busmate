import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, MapPin, Calendar, Armchair } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useBooking } from "@/lib/booking/BookingContext";
import { TicketControllerService } from "@busmate/api-client-ticketing";

/**
 * Reviews the selected seats and books them. The server (INC-011) decides the real fare and
 * whether the trip is still bookable - fareAmount here is illustrative only until the response
 * comes back, never trusted as the actual price.
 */
export default function BookingReviewPage() {
  const navigate = useNavigate();
  const { trip, selectedSeats, setBookingResult } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trip || selectedSeats.length === 0) {
      navigate("/findmybus", { replace: true });
    }
  }, [trip, selectedSeats, navigate]);

  if (!trip || selectedSeats.length === 0) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await TicketControllerService.bookTicket({
        tripId: trip.tripId,
        startLocationId: trip.fromStopId,
        endLocationId: trip.toStopId,
        seatNumbers: selectedSeats,
      });

      setBookingResult({
        ticketIds: response.ticketIds ?? (response.ticketId ? [response.ticketId] : []),
        farePerSeat: response.farePerSeat ?? 0,
        fareAmount: response.fareAmount ?? 0,
        paymentReference: response.paymentReference ?? "",
        redirectUrl: response.redirectUrl,
        checkoutFields: response.checkoutFields,
      });

      navigate("/booking/payment");
    } catch (err: any) {
      // The seat map shown a moment ago may already be stale - INC-012's own guarantee means a
      // seat someone else just took is refused here with a real reason, not a generic failure.
      setError(err?.body?.message || err?.message || "Could not complete this booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-lg">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2" disabled={submitting}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-6">Review your booking</h1>

        <Card className="mb-4">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{trip.fromStopName} → {trip.toStopName}</p>
                {trip.routeName && <p className="text-muted-foreground">{trip.routeName}</p>}
              </div>
            </div>
            {(trip.tripDate || trip.departureTime) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm">
                  {trip.tripDate} {trip.departureTime ? `· ${trip.departureTime}` : ""}
                </p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Armchair className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm">
                Seat{selectedSeats.length > 1 ? "s" : ""}: <span className="font-medium">{selectedSeats.join(", ")}</span>
                {trip.busPlateNumber && <span className="text-muted-foreground"> · Bus {trip.busPlateNumber}</span>}
              </p>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              The fare shown on the next step is calculated by BusMate at the moment of booking -
              it may differ from any estimate shown earlier if fares have since changed.
            </p>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleConfirm} disabled={submitting} className="w-full bg-gradient-primary" size="lg">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Booking..." : "Confirm and pay"}
        </Button>
      </div>
      <Footer />
    </div>
  );
}
