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
};

const ROAD = { '03': { label: 'old road', roadType: 'NORMALWAY' }, '122': { label: 'new road', roadType: 'NORMALWAY' } };
const PLATE = /\b[A-Z]{2}-\d{4}\b/g;
const TIME_LINE = /^(\d{1,2}):(\d{2})\s+(.+)$/;
const HEADER = /^[🔵👉]/u;

/**
 * Which list a header line opens, or null if it is a list this importer does not read.
 * A list is identified by its route number (03 or 122), its direction, and — coming back from Colombo — the
 * Pettah stand it leaves from, because the post separates the private Bastian Mawatha stand from the SLTB
 * Gunasinghapura one and they are different places.
 */
export function classifyHeader(header) {
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

/** Splits a departure line into its parts. Returns { row } or { problem }. */
export function parseDepartureLine(hh, mm, body) {
  const plates = [...body.matchAll(PLATE)];
  if (plates.length === 0) return { problem: 'no vehicle plate found' };

  const operator = body.slice(0, plates[0].index).trim();
  if (!operator) return { problem: 'no operator name before the plate' };

  const rest = body.slice(plates[0].index);
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
  const closeSkipped = () => {
    if (skipped) skippedSections.push(skipped);
    skipped = null;
  };
  const seenNames = new Map();

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    if (HEADER.test(line)) {
      closeSkipped();
      section = classifyHeader(line);
      facts = {};
      if (!section) skipped = { header: line.replace(/^[🔵👉]\s*/u, ''), lines: 0 };
      return;
    }
    if (!section) {
      if (skipped && TIME_LINE.test(line)) skipped.lines += 1;
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

    const parsed = parseDepartureLine(m[1], m[2], m[3]);
    if (parsed.problem) {
      problems.push({ line: i + 1, text: line, problem: parsed.problem });
      return;
    }
    const row = parsed.row;
    // Two departures of one operator at one time on one list would collide; the plate tells them apart.
    const base = `${row.departureTime} ${row.operatorName}`;
    const key = `${section.key}|${base}`;
    const n = (seenNames.get(key) ?? 0) + 1;
    seenNames.set(key, n);
    row.scheduleName = n === 1 ? base : `${base} ${row.plates[0]}`;

    departures.push({
      sectionKey: section.key,
      routeName: section.routeName,
      routeNumber: section.number,
      direction: section.direction,
      roadType: section.roadType,
      originKey: section.originKey,
      destinationKey: section.destinationKey,
      distanceKm: section.direction === 'OUTBOUND' ? facts.distanceKm ?? '' : '',
      estimatedDurationMinutes: section.direction === 'OUTBOUND' ? facts.estimatedDurationMinutes ?? '' : '',
      ...row,
      sourceLine: i + 1,
    });
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
