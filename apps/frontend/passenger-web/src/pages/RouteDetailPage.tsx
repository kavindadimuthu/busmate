import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Clock, Loader2, MapPin, Milestone } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteManagementService, BusStopManagementService } from "@busmate/api-client-core";
import type { RouteResponse, RouteStopDetailResponse } from "@busmate/api-client-core";

/** A route's full ordered stop list - for a passenger who knows the route but not their exact
 * stop (INC-014). Public, no login required. */
export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [stops, setStops] = useState<RouteStopDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [routeResult, stopsResult] = await Promise.all([
          RouteManagementService.getRouteById(id),
          BusStopManagementService.getStopsByRoute(id),
        ]);
        if (!cancelled) {
          setRoute(routeResult);
          setStops([...stopsResult].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0)));
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.body?.message || err?.message || "Could not load this route.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/routes")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All routes
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

        {!loading && !error && route && (
          <>
            <div className="flex items-center gap-2 mb-1">
              {route.routeNumber && <Badge variant="secondary">{route.routeNumber}</Badge>}
              <h1 className="text-2xl font-bold">{route.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {route.startStopName ?? "—"} → {route.endStopName ?? "—"}
              </span>
              {typeof route.distanceKm === "number" && (
                <span className="flex items-center gap-1">
                  <Milestone className="h-3.5 w-3.5" /> {route.distanceKm} km
                </span>
              )}
              {typeof route.estimatedDurationMinutes === "number" && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {route.estimatedDurationMinutes} min
                </span>
              )}
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Stops ({stops.length})
            </h2>
            <Card>
              <CardContent className="p-0">
                <ol className="divide-y divide-border">
                  {stops.map((stop, index) => (
                    <li key={stop.routeStopId ?? stop.stopId} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 min-w-0 truncate">{stop.stopName}</span>
                      {typeof stop.distanceFromStartKm === "number" && (
                        <span className="text-sm text-muted-foreground shrink-0">
                          {stop.distanceFromStartKm} km
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
