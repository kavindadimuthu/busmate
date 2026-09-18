import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Ticket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/lib/booking/BookingContext";

export default function BookingSuccessPage() {
  const navigate = useNavigate();
  const { bookingResult, trip, selectedSeats, clear } = useBooking();

  useEffect(() => {
    if (!bookingResult || !trip) {
      navigate("/tickets", { replace: true });
    }
  }, [bookingResult, trip, navigate]);

  if (!bookingResult || !trip) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-1">Booking confirmed</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {trip.fromStopName} → {trip.toStopName} · Seat{selectedSeats.length > 1 ? "s" : ""}{" "}
              {selectedSeats.join(", ")}
              {trip.busPlateNumber ? ` on bus ${trip.busPlateNumber}` : ""}
            </p>
            <p className="text-2xl font-bold mb-6">LKR {bookingResult.fareAmount.toFixed(2)}</p>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-gradient-primary"
                onClick={() => {
                  clear();
                  navigate("/tickets");
                }}
              >
                <Ticket className="h-4 w-4 mr-2" /> View my tickets
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  navigate("/");
                }}
              >
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
