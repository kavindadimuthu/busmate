import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Check, Loader2, MapPin, Search, X } from "lucide-react";
import { BusStopManagementService, CommunityContributorsService, type DuplicateStopCandidate, type PassengerStopResponse, type StopProposalRequest } from "@busmate/api-client-core";
import ProposeShell from "@/components/contribute/ProposeShell";
import PositionField from "@/components/contribute/PositionField";
import { Field } from "@/components/auth/Field";
import { CheckRow, RadioCard, TextAreaField } from "@/components/form/controls";
import { useStopSearch } from "@/lib/proposeApi";
import { useDebounced } from "@/lib/useDebounced";
import { communityMessage } from "@/lib/community/errors";
import { todayInSriLanka } from "@/lib/search";
import { changedStopFields, checkPosition, emptyStopForm, STOP_METHODS, stopFormFrom, stopProblems, stopRequest, type StopForm, type StopTarget } from "@/lib/propose.ts";
import { cn } from "@/lib/utils";

const CARD = "grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-5";
const Changed = () => <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary">Changed</span>;

type Target = StopTarget & { stopId: string; label: string };

/** Add a stop that isn't on BusMate, or correct one that's wrong. One page, two modes. Nothing sent here changes what
 * passengers see: a reviewer decides. */
export default function ProposeStopPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = todayInSriLanka();
  const [mode, setMode] = useState<"new" | "correct">("new");
  const [target, setTarget] = useState<Target | null>(null);
  const [form, setForm] = useState<StopForm>(() => emptyStopForm(today));
  const [attempted, setAttempted] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateStopCandidate | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loadingStop, setLoadingStop] = useState(false);
  const summary = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounced(search, 350);
  const results = useStopSearch(mode === "correct" && !target ? debouncedSearch : "");
  const problems = useMemo(() => stopProblems(form, { today, target }), [form, today, target]);
  const changed = useMemo(() => changedStopFields(target, form), [form, target]);
  const set = <K extends keyof StopForm>(key: K, value: StopForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const err = (k: string) => (attempted ? problems[k] : undefined);
  const livePosition = (() => {
    if (attempted) return problems.position;
    if (!form.latitude && !form.longitude) return undefined;
    const c = checkPosition(form.latitude, form.longitude);
    return c.ok === false ? c.message : undefined;
  })();

  const reset = (next: "new" | "correct") => {
    setMode(next);
    setTarget(null);
    setForm(emptyStopForm(today));
    setSearch("");
    setDuplicate(null);
    setProblem(null);
    setAttempted(false);
  };

  const choose = async (stop: PassengerStopResponse) => {
    setLoadingStop(true);
    // The search result has no Sinhala or Tamil names, so start from the whole stop. If that can't be read, the search
    // result will do: core-service keeps whatever a correction leaves out.
    let full = null;
    try {
      full = stop.stopId ? await BusStopManagementService.getStopById(stop.stopId) : null;
    } catch {
      full = null;
    }
    const t: Target = {
      stopId: stop.stopId!,
      label: full?.name ?? stop.name ?? "this stop",
      name: full?.name ?? stop.name,
      nameSinhala: full?.nameSinhala,
      nameTamil: full?.nameTamil,
      description: full?.description ?? stop.description,
      city: full?.location?.city ?? stop.city,
      latitude: full?.location?.latitude ?? stop.location?.latitude,
      longitude: full?.location?.longitude ?? stop.location?.longitude,
      isAccessible: full?.isAccessible ?? stop.isAccessible,
    };
    setTarget(t);
    setForm(stopFormFrom(t, today));
    setLoadingStop(false);
  };

  const send = useMutation({
    mutationFn: (confirm: boolean) => CommunityContributorsService.proposeStop(stopRequest(form, target?.stopId, confirm) as StopProposalRequest),
    onSuccess: async (result) => {
      if (result.duplicateCandidate) {
        setDuplicate(result.duplicateCandidate);
        return;
      }
      await qc.invalidateQueries({ queryKey: ["my-proposals"] });
      navigate("/contribute/mine", { replace: true, state: { sent: target ? "correction" : "stop" } });
    },
    onError: (e) => setProblem(communityMessage(e, "We couldn't send your proposal. Please try again.")),
  });

  const submit = (confirm: boolean) => {
    setProblem(null);
    setAttempted(true);
    if (Object.keys(problems).length > 0) {
      window.setTimeout(() => summary.current?.focus(), 0);
      return;
    }
    send.mutate(confirm);
  };

  const showForm = mode === "new" || target !== null;
  const problemCount = Object.keys(problems).filter((k) => k !== "_form").length;

  return (
    <ProposeShell title="Propose a stop" back={{ to: "/contribute/mine", label: "Contributions" }}>
      <p className="text-[13px] leading-relaxed text-muted-foreground">Add a stop that isn't on BusMate yet, or correct one that's wrong. A reviewer checks it before anyone else sees it.</p>

      <div role="group" aria-label="What you are proposing" className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
        {([["new", "New stop"], ["correct", "Correct a stop"]] as const).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => mode !== m && reset(m)} className={cn("min-h-11 rounded-xl px-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-soft")}>
            {label}
          </button>
        ))}
      </div>

      {mode === "correct" && !target && (
        <section aria-label="Find the stop" className={cn(CARD, "mt-4")}>
          <label className="relative block">
            <span className="mb-1.5 block text-[13px] font-bold">Search for the stop</span>
            <Search className="pointer-events-none absolute left-3.5 top-[2.35rem] h-5 w-5 text-muted-foreground" aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Stop name or town" autoComplete="off" spellCheck={false} enterKeyHint="search" className="block min-h-12 w-full rounded-xl border border-border bg-card pl-11 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/25" />
          </label>
          {loadingStop && <p role="status" className="flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading the stop…</p>}
          {results.isError && <p role="alert" className="text-[13px] text-destructive">We couldn't search just now. Try again in a moment.</p>}
          {results.data && (results.data.content ?? []).length === 0 && search.trim().length >= 2 && <p className="text-[13px] text-muted-foreground">No stop found for "{search.trim()}". Try a shorter name.</p>}
          {(results.data?.content ?? []).length > 0 && (
            <ul className="grid gap-2" aria-label="Matching stops">
              {results.data!.content!.map((s) => (
                <li key={s.stopId}>
                  <button type="button" onClick={() => choose(s)} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-soft px-3.5 py-2 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <MapPin className="h-4 w-4 flex-none text-primary" aria-hidden />
                    <span className="min-w-0 text-sm">
                      <span className="block font-bold">{s.name}</span>
                      {s.city && <span className="block text-xs text-muted-foreground">{s.city}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); submit(false); }} noValidate className="mt-4 grid gap-4">
          {target && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-soft px-4 py-3 text-sm">
              <span className="min-w-0">Correcting <strong>{target.label}</strong>. What you change is marked.</span>
              <button type="button" onClick={() => reset("correct")} aria-label="Choose a different stop" className="grid h-11 w-11 flex-none place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}

          {attempted && (problemCount > 0 || problems._form) && (
            <div ref={summary} tabIndex={-1} role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 outline-none dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
              {problems._form ?? "Some of this needs fixing before it can be sent. It's marked below."}
            </div>
          )}

          <section aria-label="The stop" className={CARD}>
            <Field label="Name (English)" placeholder="As it's written at the stop, or as people say it" autoComplete="off" value={form.name} onChange={(e) => set("name", e.target.value)} error={err("name")} labelAside={changed.has("name") ? <Changed /> : undefined} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (Sinhala)" autoComplete="off" lang="si" value={form.nameSinhala} onChange={(e) => set("nameSinhala", e.target.value)} labelAside={changed.has("nameSinhala") ? <Changed /> : undefined} />
              <Field label="Name (Tamil)" autoComplete="off" lang="ta" value={form.nameTamil} onChange={(e) => set("nameTamil", e.target.value)} labelAside={changed.has("nameTamil") ? <Changed /> : undefined} />
            </div>
            <Field label="Town or city" autoComplete="off" value={form.city} onChange={(e) => set("city", e.target.value)} labelAside={changed.has("city") ? <Changed /> : undefined} />
            <TextAreaField label="Description (optional)" className="min-h-20" placeholder="Where exactly it is: opposite the market, by the temple…" value={form.description} onChange={(e) => set("description", e.target.value)} aside={changed.has("description") ? <Changed /> : undefined} />
            <CheckRow checked={form.isAccessible} onChange={(e) => set("isAccessible", e.target.checked)}>
              <span className="flex flex-wrap items-center gap-2">This stop is wheelchair accessible {changed.has("isAccessible") && <Changed />}</span>
            </CheckRow>
          </section>

          <section aria-label="Where it is" className={CARD}>
            <PositionField latitude={form.latitude} longitude={form.longitude} error={livePosition} changed={changed.has("position")} onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))} />
          </section>

          <section aria-label="How you know" className={CARD}>
            <h2 className="text-[15px] font-extrabold">How do you know this?</h2>
            <Field label="The day you saw it" type="date" max={today} value={form.observedOn} onChange={(e) => set("observedOn", e.target.value)} error={err("observedOn")} />
            <fieldset>
              <legend className="mb-1.5 text-[13px] font-bold">How you know</legend>
              <div className="grid gap-2">
                {STOP_METHODS.map((m) => (
                  <RadioCard key={m.value} name="observationMethod" value={m.value} checked={form.observationMethod === m.value} onChange={() => set("observationMethod", m.value)}>
                    {m.label}
                  </RadioCard>
                ))}
              </div>
              {err("observationMethod") && <p className="mt-1.5 text-[13px] font-medium text-destructive">{err("observationMethod")}</p>}
            </fieldset>
            <TextAreaField label="Note for the reviewer (optional)" className="min-h-20" value={form.note} onChange={(e) => set("note", e.target.value)} error={err("note")} hint={`${form.note.trim().length}/500`} />
          </section>

          {duplicate && (
            <div role="alert" className="grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                <span>
                  There's already a stop called <strong>{duplicate.name}</strong> about {Math.round(duplicate.distanceMeters ?? 0)} m away. Is yours a different stop?
                </span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setDuplicate(null)} className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-amber-400 px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Let me check
                </button>
                <button type="button" disabled={send.isPending} onClick={() => submit(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
                  <Check className="h-4 w-4" aria-hidden />
                  Yes, send it anyway
                </button>
              </div>
            </div>
          )}

          {problem && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
              {problem}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <button type="submit" disabled={send.isPending || !!duplicate} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
              {send.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {send.isPending ? "Sending…" : "Send for review"}
            </button>
          </div>
        </form>
      )}
    </ProposeShell>
  );
}
