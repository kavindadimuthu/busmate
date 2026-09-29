import { useEffect, useState } from "react";
import { RouteManagementService } from "@busmate/api-client-core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/ThemeProvider";

type GatewayStatus =
  | { state: "loading" }
  | { state: "ok"; routeCount: number }
  | { state: "error"; message: string };

/**
 * Scaffold placeholder (INC-063). Calls the same public, unauthenticated endpoint
 * RoutesPage.tsx uses in passenger-web (RouteManagementService.getAllRoutesAsList())
 * against the real api-gateway — no mock data — so this page doubles as the proof that
 * the new app's wiring actually works before any real screen is built.
 */
export default function HomePage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [status, setStatus] = useState<GatewayStatus>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const routes = await RouteManagementService.getAllRoutesAsList();
        if (!cancelled) setStatus({ state: "ok", routeCount: routes.length });
      } catch (err: any) {
        if (!cancelled) {
          setStatus({ state: "error", message: err?.body?.message || err?.message || "Request failed." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>BusMate — passenger-web v2</CardTitle>
          <CardDescription>
            Scaffold only (INC-063). Not linked from anywhere real yet — see ADR-029.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            {status.state === "loading" && <span className="text-muted-foreground">Calling api-gateway…</span>}
            {status.state === "ok" && (
              <span className="text-foreground">
                Connected to api-gateway — {status.routeCount} published route{status.routeCount === 1 ? "" : "s"} found.
              </span>
            )}
            {status.state === "error" && (
              <span className="text-destructive">Gateway call failed: {status.message}</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            Toggle theme (currently {theme})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
