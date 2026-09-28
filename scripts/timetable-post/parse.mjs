// Reads a community bus-timetable post (pasted text) into one row per departure. INC-048.
//
// It records only what the post says. It never invents an operating day, a service class or a position,
// never captures a booking phone number, and reports every section and line it did not understand, so
// coverage is a number rather than a hope. Pure functions, no I/O: the CLI in import.mjs does the rest.

/** The stops these lists start and end at. English names are transliterations chosen here, not the post's. */
export const STOPS = {
  EMBILIPITIYA: {
    name: 'Embilipitiya Central Bus Stand', nameSinhala: 'ඇඹිලිපිටිය මධ්‍යම බස් නැවතුම්පොළ',
    city: 'Embilipitiya', citySinhala: 'ඇඹිලිපිටිය',
  },
  COLOMBO: { name: 'Colombo Pettah (bus stand)', nameSinhala: 'පිටකොටුව', city: 'Colombo', citySinhala: 'කොළඹ' },
  PETTAH_BASTIAN: {
    name: 'Pettah Bastian Mawatha Bus Stand',
    nameSinhala: 'පිටකොටුව බැස්ටියන් මාවත අන්තර් පළාත් දුර ගමන් සේවා බස් නැවතුම්පොළ',
    city: 'Colombo', citySinhala: 'කොළඹ',
  },
  PETTAH_GUNASINGHAPURA: {
    name: 'Pettah Gunasinghapura Bodhiraja Mawatha Bus Stand',
    nameSinhala: 'පිටකොටුව ගුණසිංහපුර බෝධිරාජ මාවත බස් නැවතුම්පොළ',
    city: 'Colombo', citySinhala: 'කොළඹ',
  },
  // The Southern Expressway section (INC-059) names these as plain places, never "bus stand" — kept as the
  // post itself names them, not padded out with a title it never used.
  MAKUMBURA: { name: 'Makumbura', nameSinhala: 'මාකුඹුර', city: 'Makumbura', citySinhala: 'මාකුඹුර' },
  KADUWELA: { name: 'Kaduwela', nameSinhala: 'කඩුවෙල', city: 'Kaduwela', citySinhala: 'කඩුවෙල' },
  KADAWATHA: { name: 'Kadawatha', nameSinhala: 'කඩවත', city: 'Kadawatha', citySinhala: 'කඩවත' },
  KARAPITIYA: { name: 'Karapitiya', nameSinhala: 'කරාපිටිය', city: 'Galle', citySinhala: 'ගාල්ල' },
};

const ROAD = { '03': { label: 'old road', roadType: 'NORMALWAY' }, '122': { label: 'new road', roadType: 'NORMALWAY' } };
const PLATE = /\b[A-Z]{2}-\d{4}\b/g;
const TIME_LINE = /^(\d{1,2}):(\d{2})\s+(.+)$/;
const HEADER = /^[🔵👉]/u;

// The post always pairs Galle with Karapitiya as one stand and never lists Galle alone, so the more specific
// of the two names is what BusMate calls the stop; "Galle" only ever appears as the route's own name.
const EXPRESSWAY_PLACES = { 'කඩුවෙල': 'KADUWELA', 'ගාල්ල': 'KARAPITIYA', 'මාකුඹුර': 'MAKUMBURA', 'කඩවත': 'KADAWATHA', 'කරාපිටිය': 'KARAPITIYA' };
// A sub-header's leading place-name, "from X", for the legs that run the other way, back to Embilipitiya.
// "කොළඹින්" (from Colombo) is deliberately not here: every vehicle in that list also appears under its
// Kaduwela or Makumbura leg, so reading it too would record the same vehicle twice under two different names.
const EXPRESSWAY_REVERSE = { 'මාකුඹුරෙන්': 'MAKUMBURA', 'කඩවතින්': 'KADAWATHA', 'කඩුවෙලින්': 'KADUWELA', 'කරාපිටියෙන්': 'KARAPITIYA' };

function expresswayRoute(originKey, destinationKey, direction) {
  const from = STOPS[originKey].name;
  const to = STOPS[destinationKey].name;
  return {
    key: `EXPRESSWAY-${originKey}-${destinationKey}`,
    direction, originKey, destinationKey,
    routeName: `${from} - ${to} via Southern Expressway`,
    roadType: 'EXPRESSWAY',
    // The post never gives these vehicles a plate as often as it does elsewhere on this corridor — "the
    // operator, unnamed vehicle" is still a valid claim (ADR-024), not a parsing failure.
    allowNoPlate: true,
  };
}

/**
 * Which list a header line opens, or null if it is a list this importer does not read.
 * A list is identified by its route number (03 or 122), its direction, and — coming back from Colombo — the
 * Pettah stand it leaves from, because the post separates the private Bastian Mawatha stand from the SLTB
 * Gunasinghapura one and they are different places.
 */
export function classifyHeader(header) {
  // Southern Expressway, departing Embilipitiya: the destination differs by line (Kaduwela, Karapitiya,
  // Makumbura, Kadawatha), so this section carries no fixed route at all — each departure line names its own.
  if (header.includes('ඇඹිලිපිටියෙන් පිටත්වීමේ වේලාවන්')) {
    return { variableDestination: true, originKey: 'EMBILIPITIYA', direction: 'OUTBOUND', allowNoPlate: true };
  }
  // Southern Expressway, the return leg from one of those same places: one fixed route, ordinary one-line
  // departures, just without a plate as often.
  for (const [prefix, placeKey] of Object.entries(EXPRESSWAY_REVERSE)) {
    if (header.includes(prefix) && header.includes('ඇඹිලිපිටිය දක්වා')) {
      return expresswayRoute(placeKey, 'EMBILIPITIYA', 'INBOUND');
    }
  }

  const number = /මාර්ග අංක (\d+)/.exec(header)?.[1];
  if (!ROAD[number]) return null;
  const toColombo = header.includes('කොළඹ දක්වා');
  const toEmbilipitiya = header.includes('ඇඹිලිපිටිය දක්වා');
  if (toColombo === toEmbilipitiya) return null;

  let origin;
  if (toColombo) origin = 'EMBILIPITIYA';
  else if (header.includes('බැස්ටියන්')) origin = 'PETTAH_BASTIAN';
  else if (header.includes('ගුණසිංහපුර')) origin = 'PETTAH_GUNASINGHAPURA';
  else return null;
  const destination = toColombo ? 'COLOMBO' : 'EMBILIPITIYA';

  const road = ROAD[number];
  const away = toColombo ? 'Embilipitiya - Colombo' : `${STOPS[origin].name.replace(' Bus Stand', '')} - Embilipitiya`;
  return {
    key: `${number}-${origin}`,
    number,
    direction: toColombo ? 'OUTBOUND' : 'INBOUND',
    originKey: origin,
    destinationKey: destination,
    routeName: `${away} via ${road.label} (${number})`,
    roadType: road.roadType,
  };
}

/** Distance and duration the post states for a list, from the block under an outbound header. */
function statedFacts(line, facts) {
  const km = /(\d+)\s*km/i.exec(line);
  if (km) facts.distanceKm = Number(km[1]);
  const time = /පැය\s*(\d+)\s*මිනිත්තු\s*(\d+)/.exec(line);
  if (time) facts.estimatedDurationMinutes = Number(time[1]) * 60 + Number(time[2]);
}

/**
 * Splits a departure line into its parts. Returns { row } or { problem }.
 * `plateRequired` is on by default — this list's own plates are the evidence the operator name was even read
 * correctly. A few lists genuinely never give one (the Southern Expressway's return legs); the caller opts a
 * list out rather than this function guessing per line, so "no plate" always means the list said so, not a
 * quiet parsing miss.
 */
export function parseDepartureLine(hh, mm, body, { plateRequired = true } = {}) {
  const plates = [...body.matchAll(PLATE)];
  if (plates.length === 0 && plateRequired) return { problem: 'no vehicle plate found' };

  const operatorEnd = plates.length ? plates[0].index : (body.includes('(') ? body.indexOf('(') : body.length);
  const operator = body.slice(0, operatorEnd).trim();
  if (!operator) return { problem: plates.length ? 'no operator name before the plate' : 'no operator name' };

  const rest = body.slice(operatorEnd);
  const qualifiers = [...rest.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim()).filter(Boolean);

  const facts = { serviceClass: '', sundayExcluded: false, rotation: false, notes: [] };
  for (const q of qualifiers) {
    if (/rotation/i.test(q)) facts.rotation = true;
    else if (q.includes('ඉරිදා හැර')) facts.sundayExcluded = true;
    else if (q.includes('අර්ධ සුඛෝපභෝගී')) facts.serviceClass = 'SEMI_LUXURY';
    else facts.notes.push(q); // where it starts, where it stops short, a nickname: kept as the post wrote it
  }
  return {
    row: {
      departureTime: `${hh.padStart(2, '0')}:${mm}`,
      operatorName: operator,
      plates: plates.map((m) => m[0]),
      ...facts,
    },
  };
}

/**
 * The destination named on a Southern-Expressway-from-Embilipitiya line, e.g. "කඩුවෙල-කොළඹ(බත්තරමුල්ල,
 * බොරැල්ල හරහා)". BusMate's route ends at the first place named — Kaduwela, here — because that is the
 * expressway stand every one of these buses reliably reaches; a hyphen after it means the post says the
 * journey carries on further, which is kept as a note in the post's own words, not modelled as a second stop
 * (the same "through-running… kept as description text only" rule INC-048 already used). Returns null when
 * the named place isn't one BusMate knows.
 */
function expresswayDestination(text) {
  const parenNotes = [...text.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim()).filter(Boolean);
  const place = text.replace(/\(.*/, '').trim();
  const first = place.split('-')[0].trim();
  const destinationKey = EXPRESSWAY_PLACES[first];
  if (!destinationKey) return null;
  return { destinationKey, notes: place.includes('-') ? [place, ...parenNotes] : parenNotes };
}

/**
 * @param {string} text the pasted post
 * @returns {{ departures: object[], skippedSections: {header: string, lines: number}[], problems: object[], ignored: object }}
 */
export function parsePost(text) {
  const departures = [];
  const skippedSections = [];
  const problems = [];
  const ignored = { bookingLines: 0, continuationLines: 0 };

  let section = null; // the list being read, or null while skipping
  let skipped = null;
  let facts = {};
  // While reading a variable-destination list (the Southern Expressway from Embilipitiya), a departure is two
  // lines: this holds the destination just read, waiting for the operator line that completes it.
  let pendingDestination = null;
  const closeSkipped = () => {
    if (skipped) skippedSections.push(skipped);
    skipped = null;
  };
  const seenNames = new Map();

  const push = (sectionInfo, row, extraNotes, sourceLine) => {
    row.notes = [...(extraNotes ?? []), ...row.notes];
    // Two departures of one operator at one time on one list would collide; the plate tells them apart, or —
    // lacking one — which line of the post it was, so nothing is silently dropped for want of a plate.
    const base = `${row.departureTime} ${row.operatorName}`;
    const key = `${sectionInfo.key}|${base}`;
    const n = (seenNames.get(key) ?? 0) + 1;
    seenNames.set(key, n);
    row.scheduleName = n === 1 ? base : `${base} ${row.plates[0] ?? `(line ${sourceLine})`}`;

    departures.push({
      sectionKey: sectionInfo.key,
      routeName: sectionInfo.routeName,
      routeNumber: sectionInfo.number ?? '',
      direction: sectionInfo.direction,
      roadType: sectionInfo.roadType,
      originKey: sectionInfo.originKey,
      destinationKey: sectionInfo.destinationKey,
      distanceKm: sectionInfo.direction === 'OUTBOUND' ? facts.distanceKm ?? '' : '',
      estimatedDurationMinutes: sectionInfo.direction === 'OUTBOUND' ? facts.estimatedDurationMinutes ?? '' : '',
      ...row,
      sourceLine,
    });
  };

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    if (HEADER.test(line)) {
      closeSkipped();
      section = classifyHeader(line);
      facts = {};
      pendingDestination = null;
      if (!section) skipped = { header: line.replace(/^[🔵👉]\s*/u, ''), lines: 0 };
      return;
    }
    if (!section) {
      if (skipped && TIME_LINE.test(line)) skipped.lines += 1;
      return;
    }

    if (section.variableDestination) {
      if (pendingDestination) {
        // This line completes the departure the previous line named a destination for.
        const parsed = parseDepartureLine(pendingDestination.hh, pendingDestination.mm, line, { plateRequired: false });
        if (parsed.problem) problems.push({ line: i + 1, text: line, problem: parsed.problem });
        else {
          const routeInfo = expresswayRoute(section.originKey, pendingDestination.destinationKey, section.direction);
          push(routeInfo, parsed.row, pendingDestination.notes, pendingDestination.sourceLine);
        }
        pendingDestination = null;
        return;
      }
      if (/^For seat booking/i.test(line)) { ignored.bookingLines += 1; return; }
      const m = TIME_LINE.exec(line);
      if (!m) return; // no facts are stated on this list; an unrecognised line here is simply not a departure
      const dest = expresswayDestination(m[3]);
      if (!dest) {
        problems.push({ line: i + 1, text: line, problem: `unrecognised destination "${m[3]}"` });
        return;
      }
      pendingDestination = { hh: m[1], mm: m[2], sourceLine: i + 1, ...dest };
      return;
    }

    const m = TIME_LINE.exec(line);
    if (!m) {
      if (/^For seat booking/i.test(line)) ignored.bookingLines += 1; // phone numbers are never captured
      else if (line.startsWith('*') || section) {
        statedFacts(line, facts);
        if (line.startsWith('*')) ignored.continuationLines += 1;
      }
      return;
    }

    const parsed = parseDepartureLine(m[1], m[2], m[3], { plateRequired: !section.allowNoPlate });
    if (parsed.problem) {
      problems.push({ line: i + 1, text: line, problem: parsed.problem });
      return;
    }
    push(section, parsed.row, [], i + 1);
  });
  closeSkipped();
  return { departures, skippedSections, problems, ignored };
}

// ── CSV: one row per departure, so a person can check it in a spreadsheet before anything is loaded ──

export const CSV_COLUMNS = [
  'sectionKey', 'routeName', 'routeNumber', 'direction', 'roadType', 'originKey', 'destinationKey',
  'distanceKm', 'estimatedDurationMinutes', 'departureTime', 'scheduleName', 'operatorName', 'plates',
  'serviceClass', 'sundayExcluded', 'rotation', 'notes', 'sourceLine',
];

const cell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(departures) {
  const rows = departures.map((d) =>
    CSV_COLUMNS.map((c) => (c === 'plates' ? cell(d.plates.join(' | ')) : c === 'notes' ? cell(d.notes.join(' | ')) : cell(d[c]))).join(','),
  );
  return `${CSV_COLUMNS.join(',')}\n${rows.join('\n')}\n`;
}

/** Reads the CSV back, so what is loaded is exactly what was reviewed. */
export function fromCsv(csv) {
  const records = [];
  let field = '', record = [], quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) {
      if (c === '"' && csv[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n') { record.push(field); records.push(record); record = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || record.length) { record.push(field); records.push(record); }

  const [header, ...body] = records;
  return body.filter((r) => r.length > 1).map((r) => {
    const o = Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']));
    return {
      ...o,
      plates: o.plates ? o.plates.split(' | ') : [],
      notes: o.notes ? o.notes.split(' | ') : [],
      sundayExcluded: o.sundayExcluded === 'true',
      rotation: o.rotation === 'true',
    };
  });
}
