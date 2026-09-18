import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/lib/booking/BookingContext";

/** Where PayHere sends the browser back if the passenger cancels checkout (ADR-014). The seat
 * hold (INC-012) simply expires on its own after 10 minutes if nothing is done - no explicit
 * cancel call is needed here. */
export default function PayHereCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clear } = useBooking();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">Payment cancelled</p>
            <p className="text-sm text-muted-foreground mb-6">
              {orderId ? `Order ${orderId} was not completed.` : "Your booking was not completed."} Your
              seat hold will expire shortly if you don't try again.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-gradient-primary"
                onClick={() => {
                  clear();
                  navigate("/findmybus");
                }}
              >
                Search again
              </Button>
              <Button variant="outline" onClick={() => navigate("/tickets")}>
                View my tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
