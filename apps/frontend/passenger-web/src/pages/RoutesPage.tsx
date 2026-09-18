import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronRight, Loader2, MapPin, Route as RouteIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteManagementService } from "@busmate/api-client-core";
import type { RouteResponse } from "@busmate/api-client-core";

/** Browse every published route without searching from/to first (INC-014). Public, no login
 * required - core-service already permits anonymous GET here, the gateway just used to be
 * stricter than the service it fronts. */
export default function RoutesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await RouteManagementService.getAllRoutesAsList();
        if (!cancelled) {
          setRoutes([...result].sort((a, b) => (a.routeNumber ?? "").localeCompare(b.routeNumber ?? "")));
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.body?.message || err?.message || "Could not load routes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">Routes</h1>
        <p className="text-muted-foreground mb-6">Browse every published bus route.</p>

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

        {!loading && !error && routes.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <RouteIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No routes published yet.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {routes.map((route) => (
            <Card
              key={route.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/routes/${route.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {route.routeNumber && <Badge variant="secondary">{route.routeNumber}</Badge>}
                    <span className="font-semibold truncate">{route.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {route.startStopName ?? "—"} → {route.endStopName ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                  {typeof route.distanceKm === "number" && <span>{route.distanceKm} km</span>}
                  <ChevronRight className="h-4 w-4" />
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
