import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityContributorsService } from "@busmate/api-client-core";

/**
 * Shows its children only to an active steward (ADR-022). This is a courtesy: core-service refuses every
 * review request from anyone else, so a wrong answer here can hide the workspace but never widen access.
 */
export default function StewardGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "steward" | "not-steward">("loading");

  useEffect(() => {
    let cancelled = false;
    CommunityContributorsService.getMyContributorStanding()
      .then((s) => !cancelled && setState(s.activeSteward ? "steward" : "not-steward"))
      .catch(() => !cancelled && setState("not-steward"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "steward") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-xl">
        {state === "loading" ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <h1 className="text-lg font-semibold text-foreground">This area is for stewards</h1>
              <p className="text-sm text-muted-foreground">
                Stewards review other contributors' proposals in the corridors they've been appointed to. It's
                something staff offer to contributors with a good record.
              </p>
              <Button asChild variant="outline">
                <Link to="/contribute">About contributing</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
