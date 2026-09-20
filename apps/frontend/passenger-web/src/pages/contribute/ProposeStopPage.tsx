import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, MapPin, Search, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StopLocationPicker } from "@/components/contribute/StopLocationPicker";
import {
  CommunityContributorsService,
  PassengerQueryService,
  StopProposalRequest,
  type DuplicateStopCandidate,
  type PassengerStopResponse,
} from "@busmate/api-client-core";

const OBSERVATION_METHODS: { value: StopProposalRequest.observationMethod; label: string }[] = [
  { value: StopProposalRequest.observationMethod.RODE_THE_ROUTE, label: "I rode the route past this stop" },
  { value: StopProposalRequest.observationMethod.LIVES_OR_WORKS_NEARBY, label: "I live or work nearby" },
  { value: StopProposalRequest.observationMethod.TIMETABLE_OR_SIGNBOARD, label: "From a timetable or signboard" },
  { value: StopProposalRequest.observationMethod.TOLD_BY_CREW, label: "A conductor or driver told me" },
  { value: StopProposalRequest.observationMethod.OTHER, label: "Something else" },
];

interface FormState {
  name: string;
  nameSinhala: string;
  nameTamil: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isAccessible: boolean;
  observedOn: string;
  observationMethod: StopProposalRequest.observationMethod | "";
  note: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  nameSinhala: "",
  nameTamil: "",
  description: "",
  city: "",
  latitude: null,
  longitude: null,
  isAccessible: false,
  observedOn: new Date().toISOString().slice(0, 10),
  observationMethod: "",
  note: "",
};

/**
 * Propose a new stop, or search for one to correct. One page, two modes — the design calls this
 * "Propose a stop", not two separate flows (INC-030).
 */
const ProposeStopPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"new" | "correct">("new");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [targetStop, setTargetStop] = useState<PassengerStopResponse | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<PassengerStopResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateStopCandidate | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "correct" || targetStop || searchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const result = await PassengerQueryService.searchStops(undefined, undefined, searchText.trim(), undefined, 0, 8);
        if (!cancelled) setSearchResults(result.content ?? []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText, mode, targetStop]);

  const selectTargetStop = (stop: PassengerStopResponse) => {
    setTargetStop(stop);
    setChangedFields(new Set());
    setForm({
      ...EMPTY_FORM,
      name: stop.name ?? "",
      description: stop.description ?? "",
      city: stop.city ?? "",
      latitude: stop.location?.latitude ?? null,
      longitude: stop.location?.longitude ?? null,
      isAccessible: stop.isAccessible ?? false,
      observedOn: EMPTY_FORM.observedOn,
    });
  };

  const switchMode = (next: "new" | "correct") => {
    setMode(next);
    setTargetStop(null);
    setChangedFields(new Set());
    setForm(EMPTY_FORM);
    setSearchText("");
    setDuplicate(null);
  };

  const field = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (targetStop) setChangedFields((prev) => new Set(prev).add(key));
  };

  const isChanged = (key: keyof FormState) => targetStop != null && changedFields.has(key);

  const buildRequest = (confirmDuplicate: boolean): StopProposalRequest | null => {
    if (!form.name.trim()) {
      setErrors("The English name is required.");
      return null;
    }
    if (form.latitude == null || form.longitude == null) {
      setErrors("Place a pin on the map for this stop's position.");
      return null;
    }
    if (!form.observationMethod) {
      setErrors("Say how you know this.");
      return null;
    }
    setErrors(null);
    return {
      targetStopId: targetStop?.stopId,
      name: form.name.trim(),
      nameSinhala: form.nameSinhala.trim() || undefined,
      nameTamil: form.nameTamil.trim() || undefined,
      description: form.description.trim() || undefined,
      location: { latitude: form.latitude, longitude: form.longitude, city: form.city.trim() || undefined },
      isAccessible: form.isAccessible,
      observedOn: form.observedOn,
      observationMethod: form.observationMethod,
      note: form.note.trim() || undefined,
      confirmDuplicate,
    };
  };

  const submit = async (confirmDuplicate: boolean) => {
    const request = buildRequest(confirmDuplicate);
    if (!request) return;
    setSubmitting(true);
    try {
      const result = await CommunityContributorsService.proposeStop(request);
      if (result.duplicateCandidate) {
        setDuplicate(result.duplicateCandidate);
        return;
      }
      setDuplicate(null);
      toast.success(targetStop ? "Correction submitted for review" : "New stop submitted for review");
      navigate("/contribute/mine");
    } catch (err: any) {
      toast.error(err?.body?.message || err?.message || "Could not submit your proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Propose a stop</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Add a stop you know isn't on BusMate yet, or correct one that's wrong.
        </p>

        <div className="flex gap-2 mb-6">
          <Button variant={mode === "new" ? "default" : "outline"} onClick={() => switchMode("new")} className={mode === "new" ? "bg-gradient-primary" : ""}>
            New stop
          </Button>
          <Button variant={mode === "correct" ? "default" : "outline"} onClick={() => switchMode("correct")} className={mode === "correct" ? "bg-gradient-primary" : ""}>
            Correct an existing stop
          </Button>
        </div>

        {mode === "correct" && !targetStop && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-3">
              <Label htmlFor="stop-search">Search for the stop</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stop-search"
                  className="pl-9"
                  placeholder="Stop name or city…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {searchResults.length > 0 && (
                <ul className="divide-y divide-border border border-border rounded-md">
                  {searchResults.map((stop) => (
                    <li key={stop.stopId}>
                      <button
                        type="button"
                        onClick={() => selectTargetStop(stop)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">
                          <span className="font-medium">{stop.name}</span>
                          {stop.city && <span className="text-muted-foreground"> · {stop.city}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {(mode === "new" || targetStop) && (
          <div className="space-y-4">
            {targetStop && (
              <div className="flex items-center justify-between bg-muted/40 border border-border rounded-md px-3 py-2 text-sm">
                <span>
                  Correcting <strong>{targetStop.name}</strong>
                  {changedFields.size > 0 && <span className="text-muted-foreground"> — fields you've changed are highlighted</span>}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode("correct")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Choose a different stop"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className={isChanged("name") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                  <Label htmlFor="stop-name">Name (English)</Label>
                  <Input id="stop-name" value={form.name} onChange={(e) => field("name", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={isChanged("nameSinhala") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                    <Label htmlFor="stop-name-si">Name (Sinhala)</Label>
                    <Input id="stop-name-si" value={form.nameSinhala} onChange={(e) => field("nameSinhala", e.target.value)} />
                  </div>
                  <div className={isChanged("nameTamil") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                    <Label htmlFor="stop-name-ta">Name (Tamil)</Label>
                    <Input id="stop-name-ta" value={form.nameTamil} onChange={(e) => field("nameTamil", e.target.value)} />
                  </div>
                </div>
                <div className={isChanged("city") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                  <Label htmlFor="stop-city">City</Label>
                  <Input id="stop-city" value={form.city} onChange={(e) => field("city", e.target.value)} />
                </div>
                <div className={isChanged("description") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                  <Label htmlFor="stop-desc">Description (optional)</Label>
                  <Textarea id="stop-desc" rows={2} value={form.description} onChange={(e) => field("description", e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.isAccessible} onCheckedChange={(v) => field("isAccessible", !!v)} />
                  This stop is wheelchair accessible
                </label>

                <div className={isChanged("latitude") || isChanged("longitude") ? "ring-2 ring-primary/40 rounded-md p-1 -m-1" : ""}>
                  <Label>Position</Label>
                  <StopLocationPicker
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onChange={(lat, lng) => {
                      field("latitude", lat);
                      field("longitude", lng);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">How do you know this?</h3>
                <div>
                  <Label htmlFor="observed-on">When did you observe it?</Label>
                  <Input
                    id="observed-on"
                    type="date"
                    max={EMPTY_FORM.observedOn}
                    value={form.observedOn}
                    onChange={(e) => field("observedOn", e.target.value)}
                  />
                </div>
                <div>
                  <Label>How you know this</Label>
                  <Select value={form.observationMethod} onValueChange={(v) => field("observationMethod", v as StopProposalRequest.observationMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note">Note for the reviewer (optional)</Label>
                  <Textarea id="note" rows={2} value={form.note} onChange={(e) => field("note", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {duplicate && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    There's already a stop called <strong>{duplicate.name}</strong> about{" "}
                    {Math.round(duplicate.distanceMeters)}m away. Is this a different stop?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDuplicate(null)}>
                    Let me check
                  </Button>
                  <Button size="sm" onClick={() => submit(true)} disabled={submitting}>
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Yes, submit it anyway
                  </Button>
                </div>
              </div>
            )}

            {errors && <p className="text-sm text-destructive">{errors}</p>}

            <Button size="lg" className="bg-gradient-primary" onClick={() => submit(false)} disabled={submitting || !!duplicate}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit for review
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProposeStopPage;
