import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SeatMap, { type SeatLayout } from "@/components/booking/SeatMap";
import { useBooking } from "@/lib/booking/BookingContext";
import { BusManagementService } from "@busmate/api-client-core";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import type { ConductorLogTicketDTO } from "@busmate/api-client-ticketing";

const MAX_SEATS_PER_BOOKING = 5; // mirrors ticketing-service's booking.max-seats-per-booking

function defaultLayout(capacity: number): SeatLayout {
  const rows: SeatLayout["rows"] = [];
  let n = 1;
  while (n <= capacity) {
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i < 2 && n <= capacity; i++) left.push(String(n++));
    for (let i = 0; i < 2 && n <= capacity; i++) right.push(String(n++));
    rows.push({ left, right });
  }
  return { layoutName: `2+2 (${capacity})`, rows, blockedSeats: [] };
}

/**
 * Seat selection for a specific trip - the real bus seat layout merged with real occupancy
 * (INC-011/INC-012), the same pattern already proven live in conductor-mobile.
 */
export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTrip, selectedSeats, setSelectedSeats } = useBooking();

  const tripId = searchParams.get("tripId") ?? "";
  const busId = searchParams.get("busId") ?? "";
  const fromStopId = searchParams.get("fromStopId") ?? "";
  const toStopId = searchParams.get("toStopId") ?? "";
  const fromStopName = searchParams.get("fromStopName") ?? "";
  const toStopName = searchParams.get("toStopName") ?? "";
  const routeName = searchParams.get("routeName") ?? undefined;
  const operatorName = searchParams.get("operatorName") ?? undefined;
  const tripDate = searchParams.get("tripDate") ?? undefined;
  const departureTime = searchParams.get("departureTime") ?? undefined;
  const arrivalTime = searchParams.get("arrivalTime") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<SeatLayout | null>(null);
  const [busPlateNumber, setBusPlateNumber] = useState<string | undefined>();
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  const [localSelection, setLocalSelection] = useState<string[]>([]);

  const missingParams = !tripId || !busId || !fromStopId || !toStopId;

  useEffect(() => {
    if (missingParams) {
      setError("This booking link is missing information. Please start again from a trip's details page.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const bus = await BusManagementService.getBusById(busId);
        // Seats already held by a live ticket (INC-012) never show as available here - excluding
        // CANCELLED tickets is what makes a freed seat actually show as free, same fix applied to
        // conductor-mobile's seat map for the same underlying reason.
        const tickets: ConductorLogTicketDTO[] = await TicketControllerService.getTicketsByTripId(tripId)
          .catch(() => [] as ConductorLogTicketDTO[]); // 404 = no tickets yet, not an error

        if (cancelled) return;

        const resolvedLayout: SeatLayout = bus.seatLayout?.rows?.length
          ? (bus.seatLayout as SeatLayout)
          : defaultLayout(bus.capacity ?? 0);

        const occupied = new Set<string>();
        tickets
          .filter((t) => String(t.validationStatus).toUpperCase() !== "CANCELLED")
          .forEach((t) => {
            if (t.seatNumber) {
              t.seatNumber.split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => occupied.add(s));
            }
          });

        setLayout(resolvedLayout);
        setBusPlateNumber(bus.plateNumber);
        setOccupiedSeats(occupied);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.body?.message || err?.message || "Could not load the seat map. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, busId, missingParams]);

  const toggleSeat = (seat: string) => {
    setLocalSelection((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= MAX_SEATS_PER_BOOKING) return prev;
      return [...prev, seat];
    });
  };

  const canContinue = localSelection.length > 0;

  const handleContinue = () => {
    setTrip({
      tripId,
      busId,
      busPlateNumber,
      fromStopId,
      toStopId,
      fromStopName,
      toStopName,
      routeName,
      operatorName,
      tripDate,
      departureTime,
      arrivalTime,
    });
    setSelectedSeats(localSelection);
    navigate("/booking/review");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-1">Choose your seat</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {fromStopName && toStopName ? `${fromStopName} → ${toStopName}` : "Select up to 5 seats"}
        </p>

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

        {!loading && !error && layout && (
          <>
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                {busPlateNumber && (
                  <p className="text-xs text-muted-foreground mb-4 text-center">Bus {busPlateNumber} · {layout.layoutName}</p>
                )}
                <SeatMap
                  layout={layout}
                  occupiedSeats={occupiedSeats}
                  selectedSeats={localSelection}
                  onToggleSeat={toggleSeat}
                />
              </CardContent>
            </Card>

            <div className="sticky bottom-4">
              <Card className="shadow-lg border-primary/20">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {localSelection.length > 0
                        ? `${localSelection.length} seat${localSelection.length > 1 ? "s" : ""}: ${localSelection.join(", ")}`
                        : "No seats selected"}
                    </span>
                  </div>
                  <Button onClick={handleContinue} disabled={!canContinue} className="bg-gradient-primary">
                    Continue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
