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
import { CommunityContributorsService, WorkingCorrectionRequest } from "@busmate/api-client-core";
import { coreErrorMessage } from "@/lib/coreError";

const METHODS: { value: WorkingCorrectionRequest.observationMethod; label: string }[] = [
  { value: WorkingCorrectionRequest.observationMethod.RODE_THE_ROUTE, label: "I rode this bus" },
  { value: WorkingCorrectionRequest.observationMethod.LIVES_OR_WORKS_NEARBY, label: "I see it regularly where I live or work" },
  { value: WorkingCorrectionRequest.observationMethod.TIMETABLE_OR_SIGNBOARD, label: "From a timetable or signboard" },
  { value: WorkingCorrectionRequest.observationMethod.TOLD_BY_CREW, label: "A conductor or driver told me" },
  { value: WorkingCorrectionRequest.observationMethod.OTHER, label: "Something else" },
];

const CLASSES: { value: WorkingCorrectionRequest.serviceClass; label: string }[] = [
  { value: WorkingCorrectionRequest.serviceClass.NORMAL, label: "Normal" },
  { value: WorkingCorrectionRequest.serviceClass.SEMI_LUXURY, label: "Semi-luxury" },
  { value: WorkingCorrectionRequest.serviceClass.LUXURY, label: "Luxury" },
  { value: WorkingCorrectionRequest.serviceClass.SUPER_LUXURY, label: "Super luxury" },
  { value: WorkingCorrectionRequest.serviceClass.EXPRESSWAY_SUPER_LUXURY, label: "Expressway super luxury" },
];

const today = () => new Date().toLocaleDateString("en-CA");

/**
 * Correct a working already on record, or say it has stopped (INC-058, ADR-027). Everything is optional:
 * leaving a field blank keeps it as it is, the same rule a stop's correction follows.
 */
export default function ProposeWorkingCorrectionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workingId = params.get("workingId");
  const [operator, setOperator] = useState("");
  const [plates, setPlates] = useState("");
  const [serviceClass, setServiceClass] = useState<WorkingCorrectionRequest.serviceClass | "">("");
  const [stopped, setStopped] = useState(false);
  const [endDate, setEndDate] = useState(today());
  const [observedOn, setObservedOn] = useState(today());
  const [method, setMethod] = useState<WorkingCorrectionRequest.observationMethod | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!workingId) return setError("Open this from a departure's page so we know which working it is.");
    const platesObserved = plates.trim() ? plates.split(",").map((p) => p.trim()).filter(Boolean) : undefined;
    if (!operator.trim() && !platesObserved && !serviceClass && !stopped) {
      return setError("Say what's wrong: an operator, a plate, a service class, or that it has stopped.");
    }
    if (!method) return setError("Tell us how you know.");
    setSubmitting(true);
    try {
      await CommunityContributorsService.proposeWorkingCorrection({
        targetWorkingId: workingId,
        operatorNameObserved: operator.trim() || undefined,
        platesObserved,
        serviceClass: serviceClass || undefined,
        effectiveEndDate: stopped ? endDate : undefined,
        observedOn,
        observationMethod: method,
        note: note.trim() || undefined,
      });
      toast.success("Thank you — a reviewer will look at it");
      navigate("/contribute/mine");
    } catch (err) {
      setError(coreErrorMessage(err, "Could not send your correction."));
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
        <h1 className="text-2xl font-bold text-foreground mb-1">Something changed?</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Only fill in what's different — anything you leave blank stays as it was.{" "}
          <Link to="/contribute" className="underline">
            How contributing works
          </Link>
        </p>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="correction-operator">Operator, as written on the bus now</Label>
              <Input id="correction-operator" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Leave blank if it hasn't changed" />
            </div>
            <div>
              <Label htmlFor="correction-plates">Plate numbers now, separated by commas</Label>
              <Input id="correction-plates" value={plates} onChange={(e) => setPlates(e.target.value)} placeholder="Leave blank if they haven't changed" />
            </div>
            <div>
              <Label>Service class, if that changed</Label>
              <Select value={serviceClass} onValueChange={(v) => setServiceClass(v as WorkingCorrectionRequest.serviceClass)}>
                <SelectTrigger aria-label="Service class">
                  <SelectValue placeholder="Leave blank if unchanged" />
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
            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stopped} onChange={(e) => setStopped(e.target.checked)} />
                It has stopped running like this
              </label>
              {stopped && (
                <div className="mt-2">
                  <Label htmlFor="correction-end">Last day it ran</Label>
                  <Input id="correction-end" type="date" max={today()} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="correction-observed">The day you saw it</Label>
              <Input id="correction-observed" type="date" max={today()} value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
            </div>
            <div>
              <Label>How do you know?</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as WorkingCorrectionRequest.observationMethod)}>
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
              <Label htmlFor="correction-note">Anything else a reviewer should know (optional)</Label>
              <Textarea id="correction-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
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
