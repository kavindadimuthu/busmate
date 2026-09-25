import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunityContributorsService, WorkingProposalRequest } from "@busmate/api-client-core";
import { coreErrorMessage } from "@/lib/coreError";

const METHODS: { value: WorkingProposalRequest.observationMethod; label: string }[] = [
  { value: WorkingProposalRequest.observationMethod.RODE_THE_ROUTE, label: "I rode this bus" },
  { value: WorkingProposalRequest.observationMethod.LIVES_OR_WORKS_NEARBY, label: "I see it regularly where I live or work" },
  { value: WorkingProposalRequest.observationMethod.TIMETABLE_OR_SIGNBOARD, label: "From a timetable or signboard" },
  { value: WorkingProposalRequest.observationMethod.TOLD_BY_CREW, label: "A conductor or driver told me" },
  { value: WorkingProposalRequest.observationMethod.OTHER, label: "Something else" },
];

const CLASSES: { value: WorkingProposalRequest.serviceClass; label: string }[] = [
  { value: WorkingProposalRequest.serviceClass.NORMAL, label: "Normal" },
  { value: WorkingProposalRequest.serviceClass.SEMI_LUXURY, label: "Semi-luxury" },
  { value: WorkingProposalRequest.serviceClass.LUXURY, label: "Luxury" },
  { value: WorkingProposalRequest.serviceClass.SUPER_LUXURY, label: "Super luxury" },
  { value: WorkingProposalRequest.serviceClass.EXPRESSWAY_SUPER_LUXURY, label: "Expressway super luxury" },
];

// The local day, not toISOString's UTC one, which is a day behind Sri Lanka for the first hours after midnight.
const today = () => new Date().toLocaleDateString("en-CA");

/**
 * Propose who usually works a departure (ADR-026, INC-052). Names and plates as seen: a contributor cannot pick
 * from the registry, and a reviewer decides. It is a claim about a pattern, not about today's bus.
 */
export default function ProposeWorkingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const scheduleId = params.get("scheduleId");
  const [operator, setOperator] = useState("");
  const [plates, setPlates] = useState("");
  const [serviceClass, setServiceClass] = useState<WorkingProposalRequest.serviceClass | "">("");
  const [observedOn, setObservedOn] = useState(today());
  const [method, setMethod] = useState<WorkingProposalRequest.observationMethod | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const platesObserved = plates.split(",").map((p) => p.trim()).filter(Boolean);
    if (!scheduleId) return setError("Open this from a departure's page so we know which one it is.");
    if (!operator.trim() && platesObserved.length === 0 && !serviceClass) {
      return setError("Tell us at least an operator, a plate or a service class.");
    }
    if (!method) return setError("Tell us how you know.");
    setSubmitting(true);
    try {
      await CommunityContributorsService.proposeScheduleWorking({
        scheduleId,
        operatorNameObserved: operator.trim() || undefined,
        platesObserved: platesObserved.length ? platesObserved : undefined,
        serviceClass: serviceClass || undefined,
        observedOn,
        observationMethod: method,
        note: note.trim() || undefined,
      });
      toast.success("Thank you — a reviewer will look at it");
      navigate("/contribute/mine");
    } catch (err) {
      setError(coreErrorMessage(err, "Could not send your proposal."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Who usually runs this bus?</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tell us what you have seen. Passengers will read it as "usually", never as a promise for a given day.{" "}
          <Link to="/contribute" className="underline">
            How contributing works
          </Link>
        </p>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="working-operator">Operator, as written on the bus</Label>
              <Input id="working-operator" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="e.g. Weerasinghe Midnight Express" />
            </div>
            <div>
              <Label htmlFor="working-plates">Plate numbers, separated by commas</Label>
              <Input id="working-plates" value={plates} onChange={(e) => setPlates(e.target.value)} placeholder="e.g. ND-1712, ND-1713" />
              <p className="text-xs text-muted-foreground mt-1">One plate means this bus; several mean the operator alternates among them.</p>
            </div>
            <div>
              <Label>Service class (if you know)</Label>
              <Select value={serviceClass} onValueChange={(v) => setServiceClass(v as WorkingProposalRequest.serviceClass)}>
                <SelectTrigger aria-label="Service class">
                  <SelectValue placeholder="Not sure" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="working-observed">The day you saw it</Label>
              <Input id="working-observed" type="date" max={today()} value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
            </div>
            <div>
              <Label>How do you know?</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as WorkingProposalRequest.observationMethod)}>
                <SelectTrigger aria-label="How do you know">
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="working-note">Anything else a reviewer should know (optional)</Label>
              <Textarea id="working-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={submit} disabled={submitting} className="bg-gradient-primary w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send for review
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
