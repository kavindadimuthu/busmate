// Pure logic for proposing a stop, who runs a bus, or a correction: what may be entered, what changed, and the requests
// that go to core-service. No React and no imports, so `node --test` runs it. core-service checks these again; the
// point of checking here is to tell a person what is wrong before they send, in words.

// ---------- position ----------

/** A box around Sri Lanka, generous enough for the islands and the sea just off the coast. */
export const SRI_LANKA = { latMin: 5.6, latMax: 10.1, lngMin: 79.4, lngMax: 82.2 };

export const inSriLanka = (lat: number, lng: number): boolean => lat >= SRI_LANKA.latMin && lat <= SRI_LANKA.latMax && lng >= SRI_LANKA.lngMin && lng <= SRI_LANKA.lngMax;

/** A coordinate as typed: plain decimal digits, nothing else. "7,29" and "7.29°" are refused rather than guessed at. */
export function parseCoordinate(text: string): number | null {
  const t = text.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export const formatCoordinate = (n: number): string => n.toFixed(5);

export type PositionCheck = { ok: true; lat: number; lng: number } | { ok: false; message: string };

export function checkPosition(latText: string, lngText: string): PositionCheck {
  if (!latText.trim() && !lngText.trim()) return { ok: false, message: "Place the stop: use your location, tap the map, or type the coordinates." };
  const lat = parseCoordinate(latText);
  const lng = parseCoordinate(lngText);
  if (lat === null || lng === null) return { ok: false, message: "Enter both coordinates as plain numbers, like 7.29000 and 80.63000." };
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, message: "Those aren't valid coordinates." };
  if (!inSriLanka(lat, lng)) {
    if (inSriLanka(lng, lat)) return { ok: false, message: "Latitude and longitude look the wrong way round. Latitude comes first (about 7 in Sri Lanka), then longitude (about 80)." };
    return { ok: false, message: "That position isn't in Sri Lanka. Check the numbers." };
  }
  return { ok: true, lat, lng };
}

// ---------- shared entries ----------

export const STOP_METHODS = [
  { value: "RODE_THE_ROUTE", label: "I rode the route past this stop" },
  { value: "LIVES_OR_WORKS_NEARBY", label: "I live or work nearby" },
  { value: "TIMETABLE_OR_SIGNBOARD", label: "From a timetable or signboard" },
  { value: "TOLD_BY_CREW", label: "A conductor or driver told me" },
  { value: "OTHER", label: "Something else" },
] as const;

export const WORKING_METHODS = [
  { value: "RODE_THE_ROUTE", label: "I rode this bus" },
  { value: "LIVES_OR_WORKS_NEARBY", label: "I see it regularly where I live or work" },
  { value: "TIMETABLE_OR_SIGNBOARD", label: "From a timetable or signboard" },
  { value: "TOLD_BY_CREW", label: "A conductor or driver told me" },
  { value: "OTHER", label: "Something else" },
] as const;

export const SERVICE_CLASSES = [
  { value: "NORMAL", label: "Normal" },
  { value: "SEMI_LUXURY", label: "Semi-luxury" },
  { value: "LUXURY", label: "Luxury" },
  { value: "SUPER_LUXURY", label: "Super luxury" },
  { value: "EXPRESSWAY_SUPER_LUXURY", label: "Expressway super luxury" },
] as const;

const isMethod = (list: readonly { value: string }[], v: string) => list.some((m) => m.value === v);
const isClass = (v: string) => SERVICE_CLASSES.some((c) => c.value === v);

/** A day someone saw something: a real date, and not one that hasn't happened. `today` is "YYYY-MM-DD" in Sri Lanka. */
export function checkDay(value: string, today: string, what = "you saw it"): string | null {
  if (!value) return `Say the day ${what}.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) return "Enter a real date.";
  if (value < "2000-01-01") return "Enter a real date.";
  if (value > today) return "That day hasn't happened yet.";
  return null;
}

/** "ND-1712, ND-1713" → the plates, trimmed, without repeats. Reports what is wrong with the list, if anything. */
export function parsePlates(text: string): { plates: string[]; problem: string | null } {
  const seen = new Set<string>();
  const plates: string[] = [];
  for (const raw of text.split(/[,;\n]+/)) {
    const p = raw.trim();
    if (!p || seen.has(p.toLowerCase())) continue;
    seen.add(p.toLowerCase());
    plates.push(p);
  }
  if (plates.length > 10) return { plates, problem: "Ten plates at most." };
  if (plates.some((p) => p.length > 32)) return { plates, problem: "Each plate must be 32 characters or fewer." };
  return { plates, problem: null };
}

export type Problems = Record<string, string>;

// ---------- a stop ----------

export interface StopForm {
  name: string;
  nameSinhala: string;
  nameTamil: string;
  description: string;
  city: string;
  latitude: string;
  longitude: string;
  isAccessible: boolean;
  observedOn: string;
  observationMethod: string;
  note: string;
}

/** What a stop already has, when a contributor is correcting it. */
export interface StopTarget {
  name?: string;
  nameSinhala?: string;
  nameTamil?: string;
  description?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  isAccessible?: boolean;
}

export const emptyStopForm = (today: string): StopForm => ({ name: "", nameSinhala: "", nameTamil: "", description: "", city: "", latitude: "", longitude: "", isAccessible: false, observedOn: today, observationMethod: "", note: "" });

/** The form for correcting a stop starts as that stop is now; the person changes what's wrong. */
export function stopFormFrom(t: StopTarget, today: string): StopForm {
  return {
    ...emptyStopForm(today),
    name: t.name ?? "",
    nameSinhala: t.nameSinhala ?? "",
    nameTamil: t.nameTamil ?? "",
    description: t.description ?? "",
    city: t.city ?? "",
    latitude: typeof t.latitude === "number" ? formatCoordinate(t.latitude) : "",
    longitude: typeof t.longitude === "number" ? formatCoordinate(t.longitude) : "",
    isAccessible: t.isAccessible ?? false,
  };
}

export type StopField = "name" | "nameSinhala" | "nameTamil" | "description" | "city" | "isAccessible" | "position";

const same = (a: string, b: string | undefined) => a.trim() === (b ?? "").trim();

/** Which parts of a correction differ from the stop as it is. Empty when not correcting. */
export function changedStopFields(target: StopTarget | null, form: StopForm): Set<StopField> {
  const out = new Set<StopField>();
  if (!target) return out;
  if (!same(form.name, target.name)) out.add("name");
  if (!same(form.nameSinhala, target.nameSinhala)) out.add("nameSinhala");
  if (!same(form.nameTamil, target.nameTamil)) out.add("nameTamil");
  if (!same(form.description, target.description)) out.add("description");
  if (!same(form.city, target.city)) out.add("city");
  if (form.isAccessible !== (target.isAccessible ?? false)) out.add("isAccessible");
  const lat = parseCoordinate(form.latitude);
  const lng = parseCoordinate(form.longitude);
  const near = (a: number | null, b: number | null | undefined) => a !== null && typeof b === "number" && Math.abs(a - b) < 1e-6;
  if (!(near(lat, target.latitude) && near(lng, target.longitude))) out.add("position");
  return out;
}

/** Everything wrong with a stop proposal, by field. `_form` is a problem with the whole thing. */
export function stopProblems(form: StopForm, opts: { today: string; target: StopTarget | null }): Problems {
  const p: Problems = {};
  if (!form.name.trim()) p.name = "The English name is required.";
  const pos = checkPosition(form.latitude, form.longitude);
  if (pos.ok === false) p.position = pos.message;
  const day = checkDay(form.observedOn, opts.today);
  if (day) p.observedOn = day;
  if (!isMethod(STOP_METHODS, form.observationMethod)) p.observationMethod = "Say how you know this.";
  if (form.note.trim().length > 500) p.note = "Keep the note under 500 characters.";
  if (opts.target && changedStopFields(opts.target, form).size === 0) p._form = "You haven't changed anything yet. Change what's wrong, then send it.";
  return p;
}

const blank = (s: string): string | undefined => s.trim() || undefined;

/** The stop proposal as core-service takes it. Blank optional fields are left out; a correction sends the whole stop, and
 * what it doesn't change stays as it was. Call only when there are no problems. */
export function stopRequest(form: StopForm, targetStopId: string | undefined, confirmDuplicate: boolean) {
  const pos = checkPosition(form.latitude, form.longitude);
  if (pos.ok === false) throw new Error("stopRequest needs a valid position");
  return {
    targetStopId,
    name: form.name.trim(),
    nameSinhala: blank(form.nameSinhala),
    nameTamil: blank(form.nameTamil),
    description: blank(form.description),
    location: { latitude: pos.lat, longitude: pos.lng, city: blank(form.city) },
    isAccessible: form.isAccessible,
    observedOn: form.observedOn,
    observationMethod: form.observationMethod,
    note: blank(form.note),
    confirmDuplicate,
  };
}

// ---------- who runs a bus ----------

export interface WorkingForm {
  operator: string;
  plates: string;
  serviceClass: string;
  observedOn: string;
  observationMethod: string;
  note: string;
}

export const emptyWorkingForm = (today: string): WorkingForm => ({ operator: "", plates: "", serviceClass: "", observedOn: today, observationMethod: "", note: "" });

function commonWorkingProblems(f: WorkingForm, today: string, p: Problems) {
  if (f.operator.trim().length > 255) p.operator = "Keep the operator's name under 255 characters.";
  const plates = parsePlates(f.plates);
  if (plates.problem) p.plates = plates.problem;
  const day = checkDay(f.observedOn, today);
  if (day) p.observedOn = day;
  if (!isMethod(WORKING_METHODS, f.observationMethod)) p.observationMethod = "Tell us how you know.";
  if (f.note.trim().length > 1000) p.note = "Keep the note under 1,000 characters.";
}

/** A proposal that says who runs a departure: at least an operator, a plate or a class, and how you know. */
export function workingProblems(f: WorkingForm, today: string): Problems {
  const p: Problems = {};
  if (!f.operator.trim() && parsePlates(f.plates).plates.length === 0 && !isClass(f.serviceClass)) p._form = "Tell us at least an operator, a plate or a service class.";
  commonWorkingProblems(f, today, p);
  return p;
}

export function workingRequest(f: WorkingForm, scheduleId: string) {
  const { plates } = parsePlates(f.plates);
  return {
    scheduleId,
    operatorNameObserved: blank(f.operator),
    platesObserved: plates.length ? plates : undefined,
    serviceClass: isClass(f.serviceClass) ? f.serviceClass : undefined,
    observedOn: f.observedOn,
    observationMethod: f.observationMethod,
    note: blank(f.note),
  };
}

// ---------- a correction to a working ----------

export interface CorrectionForm extends WorkingForm {
  stopped: boolean;
  endDate: string;
}

export const emptyCorrectionForm = (today: string): CorrectionForm => ({ ...emptyWorkingForm(today), stopped: false, endDate: today });

/** Everything is optional except that something must be said: an operator, plates, a class, or that it has stopped.
 * What's left blank stays as recorded. */
export function correctionProblems(f: CorrectionForm, today: string): Problems {
  const p: Problems = {};
  if (!f.operator.trim() && parsePlates(f.plates).plates.length === 0 && !isClass(f.serviceClass) && !f.stopped) p._form = "Say what's wrong: an operator, a plate, a service class, or that it has stopped.";
  commonWorkingProblems(f, today, p);
  if (f.stopped) {
    const end = checkDay(f.endDate, today, "it last ran");
    if (end) p.endDate = end;
  }
  return p;
}

export function correctionRequest(f: CorrectionForm, targetWorkingId: string) {
  const { plates } = parsePlates(f.plates);
  return {
    targetWorkingId,
    operatorNameObserved: blank(f.operator),
    platesObserved: plates.length ? plates : undefined,
    serviceClass: isClass(f.serviceClass) ? f.serviceClass : undefined,
    effectiveEndDate: f.stopped ? f.endDate : undefined,
    observedOn: f.observedOn,
    observationMethod: f.observationMethod,
    note: blank(f.note),
  };
}
