// Run with: node --test scripts/timetable-post/parse.test.mjs
// The sample below is invented, in the same shape as a real post. No real operator, plate or phone number is
// committed: the real post lives outside the repository.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyHeader, fromCsv, parseDepartureLine, parsePost, toCsv } from './parse.mjs';

const OUT = '🔵ඇඹිලිපිටිය මධ්‍යම බස් නැවතුම්පොළින් මාර්ග අංක 03 පරණ පාර ඔස්සේ කොළඹ දක්වා ගමන්ගන්නා බස් රථ කාලසටහන';
const IN_BASTIAN = '🔵පිටකොටුව බැස්ටියන් මාවත අන්තර් පළාත් දුර ගමන් සේවා බස් නැවතුම්පොළින් මාර්ග අංක 122 අලුත් පාර ඔස්සේ ඇඹිලිපිටිය දක්වා ගමන්ගන්නා';
const IN_GUNA = '🔵පිටකොටුව ගුණසිංහපුර බෝධිරාජ මාවත බස් නැවතුම්පොළින් මාර්ග අංක 03 පරණ පාර ඔස්සේ ඇඹිලිපිටිය දක්වා ගමන්ගන්නා';
const OTHER = '🔵ඇඹිලිපිටිය මධ්‍යම බස් නැවතුම්පොළින් මාර්ග අංක 69 ඔස්සේ ගමන්ගන්නා දුර ගමන් සේවා';

test('a header identifies its list by route number, direction and, coming back, the Pettah stand', () => {
  assert.equal(classifyHeader(OUT).key, '03-EMBILIPITIYA');
  assert.equal(classifyHeader(OUT).direction, 'OUTBOUND');
  assert.equal(classifyHeader(IN_BASTIAN).key, '122-PETTAH_BASTIAN');
  assert.equal(classifyHeader(IN_GUNA).key, '03-PETTAH_GUNASINGHAPURA');
  assert.notEqual(classifyHeader(IN_BASTIAN).originKey, classifyHeader(IN_GUNA).originKey, 'the two stands are different places');
  assert.equal(classifyHeader(OTHER), null, 'a route this importer does not read');
});

test('a line gives its time, operator and plate, and nothing it is not told', () => {
  const { row } = parseDepartureLine('5', '00', 'Test Express AA-1111');
  assert.deepEqual([row.departureTime, row.operatorName, row.plates], ['05:00', 'Test Express', ['AA-1111']]);
  assert.equal(row.serviceClass, '', 'no class stated, so none recorded');
  assert.equal(row.sundayExcluded, false);
  assert.equal(row.rotation, false);
});

test('what the post states in brackets is read: class, Sunday, rotation, and other notes kept as written', () => {
  const semi = parseDepartureLine('15', '15', 'Test Travels BB-2222(අර්ධ සුඛෝපභෝගී සේවාව)').row;
  assert.equal(semi.serviceClass, 'SEMI_LUXURY');

  const sunday = parseDepartureLine('3', '50', 'Test Line CC-3333(සූරියවැව සිට 03:15 පදලංගල හරහා)(ඉරිදා හැර)').row;
  assert.equal(sunday.sundayExcluded, true);
  assert.deepEqual(sunday.notes, ['සූරියවැව සිට 03:15 පදලංගල හරහා']);

  const rotation = parseDepartureLine('7', '15', 'Test Board DD-4444 & DD-5555 (rotation)(කතරගම දක්වා)').row;
  assert.equal(rotation.rotation, true);
  assert.deepEqual(rotation.plates, ['DD-4444', 'DD-5555']);
  assert.deepEqual(rotation.notes, ['කතරගම දක්වා']);
});

test('a line with no plate, or no operator, is a problem, not a guess', () => {
  assert.match(parseDepartureLine('9', '00', 'Test Express').problem, /plate/);
  assert.match(parseDepartureLine('9', '00', 'EE-6666').problem, /operator/);
});

const POST = [
  '# a comment line is not part of the post',
  OUT,
  'සම්පූර්ණ දුර ප්‍රමාණය:165kmක් පමණ',
  'සාමාන්‍ය ධාවන කාලය:පැය 4 මිනිත්තු 45ක් පමණ',
  '',
  '05:00 Test Express AA-1111 ',
  '',
  '06:00 Sample Lines FF-7777(ඉරිදා හැර)',
  'For seat booking: 0770000000 | 0710000000',
  '',
  IN_BASTIAN,
  '08:20 Test Express AA-1111',
  '',
  OTHER,
  '03:00 මහනුවර',
  'Some Operator GG-8888',
].join('\n');

test('a post is read into one row per departure, with the distance and time its header states', () => {
  const { departures, problems } = parsePost(POST);
  assert.equal(problems.length, 0);
  assert.deepEqual(departures.map((d) => d.scheduleName), ['05:00 Test Express', '06:00 Sample Lines', '08:20 Test Express']);
  assert.equal(departures[0].distanceKm, 165);
  assert.equal(departures[0].estimatedDurationMinutes, 285);
  assert.equal(departures[2].distanceKm, '', 'the return list states none, so none is recorded');
  assert.equal(departures[2].direction, 'INBOUND');
});

test('a list it does not read is skipped and counted, never half-imported', () => {
  const { departures, skippedSections } = parsePost(POST);
  assert.equal(departures.length, 3);
  assert.equal(skippedSections.length, 1);
  assert.equal(skippedSections[0].lines, 1);
});

test('booking phone numbers are never captured anywhere in the output', () => {
  const { departures, ignored } = parsePost(POST);
  assert.equal(ignored.bookingLines, 1);
  assert.doesNotMatch(JSON.stringify(departures) + toCsv(departures), /0[71]\d{8}/);
});

test('the same operator twice at one time on one list is told apart by plate, not collapsed', () => {
  const text = `${OUT}\n05:00 Test Express AA-1111\n05:00 Test Express AA-2222`;
  const { departures } = parsePost(text);
  assert.deepEqual(departures.map((d) => d.scheduleName), ['05:00 Test Express', '05:00 Test Express AA-2222']);
});

test('the CSV a person reviews reads back to exactly the same rows', () => {
  const { departures } = parsePost(POST);
  const back = fromCsv(toCsv(departures));
  assert.equal(back.length, departures.length);
  for (const [i, d] of departures.entries()) {
    assert.equal(back[i].scheduleName, d.scheduleName);
    assert.deepEqual(back[i].plates, d.plates);
    assert.deepEqual(back[i].notes, d.notes);
    assert.equal(back[i].sundayExcluded, d.sundayExcluded);
  }
});

// ── the Southern Expressway section (INC-059) ──────────────────────────────────────────────────────────────

const EXPRESSWAY_OUT = '👉ඇඹිලිපිටියෙන් පිටත්වීමේ වේලාවන්';
const EXPRESSWAY_IN_MAKUMBURA = '👉මාකුඹුරෙන් ඇඹිලිපිටිය දක්වා පිටත්වීමේ වේලාවන්';
const EXPRESSWAY_IN_COLOMBO = '👉කොළඹින් ඇඹිලිපිටිය දක්වා පිටත්වීමේ වේලාවන්';

const EXPRESSWAY_POST = [
  EXPRESSWAY_OUT,
  '04:00 කඩුවෙල-කොළඹ(via note)(through-running note)',
  'Test Highway Express AA-1111',
  'For seat booking: 0770000000',
  '',
  '05:00 කඩුවෙල',
  'SLTB Test',
  '',
  '06:00 Somewhere Unknown',
  'SLTB Elsewhere',
  EXPRESSWAY_IN_MAKUMBURA,
  '07:00 SLTB Test',
  '',
  EXPRESSWAY_IN_COLOMBO,
  '08:00 Test Highway Express AA-1111',
  '(a via note on its own line)',
].join('\n');

test('a header with no fixed route at all is read one departure at a time, by its own two lines', () => {
  assert.equal(classifyHeader(EXPRESSWAY_OUT).variableDestination, true);
  assert.equal(classifyHeader(EXPRESSWAY_OUT).originKey, 'EMBILIPITIYA');
});

test('the return leg is a normal fixed-route list, just one that may give no plate at all', () => {
  const section = classifyHeader(EXPRESSWAY_IN_MAKUMBURA);
  assert.equal(section.originKey, 'MAKUMBURA');
  assert.equal(section.destinationKey, 'EMBILIPITIYA');
  assert.equal(section.direction, 'INBOUND');
  assert.equal(section.allowNoPlate, true);
});

test('"from Colombo" is deliberately not read: its vehicles already appear under their expressway stand', () => {
  assert.equal(classifyHeader(EXPRESSWAY_IN_COLOMBO), null);
});

test('a destination line names the route BusMate treats it as, keeping a further hop as a note verbatim', () => {
  const { departures, problems } = parsePost(EXPRESSWAY_POST);
  assert.equal(problems.length, 1, 'the one place this importer does not know');
  assert.match(problems[0].problem, /unrecognised destination/);

  const first = departures[0];
  assert.equal(first.destinationKey, 'KADUWELA');
  assert.equal(first.operatorName, 'Test Highway Express');
  assert.deepEqual(first.plates, ['AA-1111']);
  assert.deepEqual(first.notes, ['කඩුවෙල-කොළඹ', 'via note', 'through-running note']);
});

test('a line with no plate at all is a valid claim — the operator, unnamed vehicle — not a problem', () => {
  const { departures } = parsePost(EXPRESSWAY_POST);
  const noPlate = departures.find((d) => d.operatorName === 'SLTB Test' && d.departureTime === '05:00');
  assert.deepEqual(noPlate.plates, []);
  assert.equal(noPlate.scheduleName, '05:00 SLTB Test');
});

test('the reverse list reuses the ordinary one-line reader, so a stray note line after it is simply unread', () => {
  const { departures } = parsePost(EXPRESSWAY_POST);
  const fixed = departures.find((d) => d.sectionKey === 'EXPRESSWAY-MAKUMBURA-EMBILIPITIYA');
  assert.equal(fixed.operatorName, 'SLTB Test');
  assert.equal(fixed.originKey, 'MAKUMBURA');
});
