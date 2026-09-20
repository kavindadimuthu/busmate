import { Link } from "react-router-dom";
import { Eye, MapPin, ShieldCheck, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * The public "why would I do this" page (ADR-017). Anyone can read it, signed in or not; the CTA
 * sends an anonymous visitor through login first, and a signed-in passenger straight to the form.
 */
const ContributeProgrammePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Help map Sri Lanka's buses</h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-8">
          BusMate's network data comes from the ministry, from operators who join the platform, and from
          people like you who already know their routes — the stops, the timetables, the details nobody
          else has written down yet. Every contribution is checked by someone else before it reaches other
          passengers, and it is always labelled honestly: <strong>observed</strong>, not official, until an
          authority confirms it.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardContent className="p-5">
              <MapPin className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Add what you know</h3>
              <p className="text-sm text-muted-foreground">
                Propose a stop, correct a route, or fill in a timetable for a corridor you actually travel.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Eye className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Reviewed, never published blind</h3>
              <p className="text-sm text-muted-foreground">
                Nothing you submit changes what other passengers see until someone else checks it.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <ShieldCheck className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Labelled honestly</h3>
              <p className="text-sm text-muted-foreground">
                Your contributions are shown as <em>observed</em>, never claimed as official — passengers
                see the difference.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Users className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Credit that follows you</h3>
              <p className="text-sm text-muted-foreground">
                Your track record is visible to reviewers, and can grow into wider review rights over time.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/40 border border-border rounded-lg p-5 mb-8">
          <h2 className="font-semibold text-foreground mb-2">Before you apply</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>You need a verified email on your BusMate account.</li>
            <li>You'll be asked why you want to contribute, and any link you have to a bus operator.</li>
            <li>You'll accept a short agreement covering how your contributions are used and credited.</li>
            <li>Staff review every application, so it isn't instant.</li>
          </ul>
        </div>

        <Button asChild size="lg" className="bg-gradient-primary">
          <Link to={isAuthenticated ? "/contribute/apply" : "/login"} state={isAuthenticated ? undefined : { from: "/contribute/apply" }}>
            {isAuthenticated ? "Apply to contribute" : "Log in to apply"}
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
};

export default ContributeProgrammePage;
