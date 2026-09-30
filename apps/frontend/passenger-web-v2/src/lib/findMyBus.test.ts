import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activeFilterCount,
  addDays,
  applyFilters,
  arrivesNextDay,
  bandOf,
  cancelledLast,
  colomboNow,
  detailPath,
  formatClock,
  formatDayName,
  formatDuration,
  formatLongDate,
  hasExtraFilters,
  hasPassed,
  isCancelled,
  isIsoDate,
  journeyMinutes,
  NO_FILTERS,
  parseTimeOfDay,
  readSearchParams,
  resolveStopText,
  roadTypeCounts,
  routeOptions,
  shortStopName,
  sortBuses,
  splitByPassed,
  statusLabel,
  toggle,
  type BusLike,
  type StopCandidate,
} from "./findMyBus.ts";

const bus = (o: Partial<BusLike>): BusLike => ({ routeNumber: "01", roadType: "NORMALWAY", ...o });

describe("INC-066 times", () => {
  it("reads HH:mm, HH:mm:ss and ISO times, and rejects nonsense", () => {
    assert.equal(parseTimeOfDay("06:00:00"), 360);
    assert.equal(parseTimeOfDay("6:05"), 365);
    assert.equal(parseTimeOfDay("2026-09-30T14:30:00"), 870);
    assert.equal(parseTimeOfDay("24:00"), null);
    assert.equal(parseTimeOfDay("12:60"), null);
    assert.equal(parseTimeOfDay(""), null);
    assert.equal(parseTimeOfDay(undefined), null);
  });

  it("formats a 12-hour clock, with midnight and noon right", () => {
    assert.equal(formatClock(0), "12:00 AM");
    assert.equal(formatClock(360), "6:00 AM");
    assert.equal(formatClock(720), "12:00 PM");
    assert.equal(formatClock(13 * 60 + 5), "1:05 PM");
    assert.equal(formatClock(1500), "1:00 AM");
  });

  it("formats durations", () => {
    assert.equal(formatDuration(225), "3h 45m");
    assert.equal(formatDuration(45), "45m");
    assert.equal(formatDuration(120), "2h");
    assert.equal(formatDuration(0), null);
    assert.equal(formatDuration(undefined), null);
  });

  it("works out the journey from the times when the server sends no duration", () => {
    assert.equal(journeyMinutes(bus({ departureAtOrigin: "06:00:00", arrivalAtDestination: "09:45:00" })), 225);
  });

  it("counts a bus that arrives after midnight", () => {
    const night = bus({ departureAtOrigin: "22:30:00", arrivalAtDestination: "01:15:00" });
    assert.equal(journeyMinutes(night), 165);
    assert.equal(arrivesNextDay(night), true);
    assert.equal(arrivesNextDay(bus({ departureAtOrigin: "06:00", arrivalAtDestination: "09:00" })), false);
  });

  it("prefers the server's duration, and gives up when a time is missing", () => {
    assert.equal(journeyMinutes(bus({ estimatedDurationMinutes: 100, departureAtOrigin: "06:00", arrivalAtDestination: "09:00" })), 100);
    assert.equal(journeyMinutes(bus({ departureAtOrigin: "06:00" })), null);
  });

  it("uses a trip's actual departure over the timetable's", () => {
    const b = bus({ departureAtOrigin: "06:00:00", actualDepartureTime: "2026-09-30T06:12:00", arrivalAtDestination: "09:45" });
    assert.equal(journeyMinutes(b), 213);
  });
});

describe("INC-066 dates in Sri Lanka time", () => {
  it("is already tomorrow in Colombo when it is late evening UTC", () => {
    // 23:30 UTC on 29 Sep is 05:00 on 30 Sep in Colombo (UTC+5:30).
    assert.deepEqual(colomboNow(new Date("2026-09-29T23:30:00Z")), { date: "2026-09-30", minutes: 300 });
    assert.deepEqual(colomboNow(new Date("2026-09-30T03:07:00Z")), { date: "2026-09-30", minutes: 8 * 60 + 37 });
  });

  it("validates and steps ISO dates across month and year ends", () => {
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("2026-9-30"), false);
    assert.equal(isIsoDate("2026-09-30"), true);
    assert.equal(isIsoDate(null), false);
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("marks a bus passed only on today's date, from its scheduled time", () => {
    const now = new Date("2026-09-30T03:07:00Z"); // 08:37 in Colombo
    assert.equal(hasPassed(bus({ departureAtOrigin: "06:00:00" }), "2026-09-30", now), true);
    assert.equal(hasPassed(bus({ departureAtOrigin: "09:00:00" }), "2026-09-30", now), false);
    assert.equal(hasPassed(bus({ departureAtOrigin: "06:00:00" }), "2026-10-01", now), false);
    assert.equal(hasPassed(bus({ departureAtOrigin: "06:00:00" }), "2026-09-29", now), false);
    assert.equal(hasPassed(bus({ departureAtOrigin: "12:00:00", alreadyDeparted: true }), "2026-09-30", now), true);
    assert.equal(hasPassed(bus({}), "2026-09-30", now), false);
  });

  it("splits upcoming from passed and keeps each group's order", () => {
    const now = new Date("2026-09-30T03:07:00Z");
    const list = [bus({ routeNumber: "A", departureAtOrigin: "06:00" }), bus({ routeNumber: "B", departureAtOrigin: "10:00" }), bus({ routeNumber: "C", departureAtOrigin: "07:00" }), bus({ routeNumber: "D", departureAtOrigin: "15:00" })];
    const { upcoming, passed } = splitByPassed(list, "2026-09-30", now);
    assert.deepEqual(upcoming.map((b) => b.routeNumber), ["B", "D"]);
    assert.deepEqual(passed.map((b) => b.routeNumber), ["A", "C"]);
    assert.equal(splitByPassed(list, "2026-10-02", now).passed.length, 0);
  });
});

describe("INC-066 filters and sorting", () => {
  it("puts times in the right band at each boundary", () => {
    assert.equal(bandOf(4 * 60 + 59), "night");
    assert.equal(bandOf(5 * 60), "morning");
    assert.equal(bandOf(11 * 60 + 59), "morning");
    assert.equal(bandOf(12 * 60), "afternoon");
    assert.equal(bandOf(17 * 60), "evening");
    assert.equal(bandOf(20 * 60 + 59), "evening");
    assert.equal(bandOf(21 * 60), "night");
    assert.equal(bandOf(0), "night");
  });

  const list = [
    bus({ routeNumber: "01", departureAtOrigin: "06:00", arrivalAtDestination: "09:45", distanceKm: 115 }),
    bus({ routeNumber: "02", roadType: "EXPRESSWAY", departureAtOrigin: "07:00", arrivalAtDestination: "08:45", distanceKm: 119 }),
    bus({ routeNumber: "01", departureAtOrigin: "14:00", arrivalAtDestination: "17:45", distanceKm: 115 }),
    bus({ routeNumber: "03", departureAtOrigin: "22:00", arrivalAtDestination: "23:05", distanceKm: 37 }),
    bus({ routeNumber: "04" }),
  ];

  it("filters by time of day, road type and route, and combines them", () => {
    assert.equal(applyFilters(list, NO_FILTERS).length, 5);
    assert.deepEqual(applyFilters(list, { ...NO_FILTERS, bands: ["morning"] }).map((b) => b.routeNumber), ["01", "02"]);
    assert.equal(applyFilters(list, { ...NO_FILTERS, bands: ["morning", "night"] }).length, 3);
    assert.deepEqual(applyFilters(list, { ...NO_FILTERS, roadType: "EXPRESSWAY" }).map((b) => b.routeNumber), ["02"]);
    assert.equal(applyFilters(list, { ...NO_FILTERS, routes: ["01"] }).length, 2);
    assert.equal(applyFilters(list, { bands: ["morning"], roadType: "", routes: ["01"] }).length, 1);
  });

  it("drops a bus with no departure time when a time-of-day filter is on", () => {
    assert.equal(applyFilters(list, { ...NO_FILTERS, bands: ["morning", "afternoon", "evening", "night"] }).length, 4);
  });

  it("counts active filters", () => {
    assert.equal(activeFilterCount(NO_FILTERS), 0);
    assert.equal(activeFilterCount({ bands: ["morning", "night"], roadType: "EXPRESSWAY", routes: ["01"] }), 4);
  });

  it("sorts earliest, fastest and shortest, with unknowns last", () => {
    assert.deepEqual(sortBuses(list, "earliest").map((b) => b.routeNumber), ["01", "02", "01", "03", "04"]);
    assert.deepEqual(sortBuses(list, "fastest").map((b) => b.routeNumber), ["03", "02", "01", "01", "04"]);
    assert.deepEqual(sortBuses(list, "shortest").map((b) => b.routeNumber), ["03", "01", "01", "02", "04"]);
  });

  it("breaks ties by departure time, then route number, and doesn't change its input", () => {
    const tie = [bus({ routeNumber: "10", departureAtOrigin: "09:00", distanceKm: 50 }), bus({ routeNumber: "2", departureAtOrigin: "09:00", distanceKm: 50 }), bus({ routeNumber: "5", departureAtOrigin: "08:00", distanceKm: 50 })];
    assert.deepEqual(sortBuses(tie, "shortest").map((b) => b.routeNumber), ["5", "2", "10"]);
    assert.deepEqual(tie.map((b) => b.routeNumber), ["10", "2", "5"]);
  });

  it("lists route numbers naturally with counts, and counts road types", () => {
    assert.deepEqual(routeOptions([bus({ routeNumber: "10" }), bus({ routeNumber: "2" }), bus({ routeNumber: "2" })]), [{ route: "2", count: 2 }, { route: "10", count: 1 }]);
    assert.deepEqual(roadTypeCounts(list), { NORMALWAY: 4, EXPRESSWAY: 1 });
  });
});

describe("INC-066 status, links and parameters", () => {
  it("words a trip's status as what it is, never as live tracking", () => {
    assert.deepEqual(statusLabel("active"), { text: "In service", tone: "good" });
    assert.deepEqual(statusLabel("in_transit"), { text: "In service", tone: "good" });
    assert.deepEqual(statusLabel("cancelled"), { text: "Cancelled", tone: "bad" });
    assert.deepEqual(statusLabel("DELAYED"), { text: "Delayed", tone: "warn" });
    assert.equal(statusLabel("pending"), null);
    assert.equal(statusLabel("completed"), null);
    assert.equal(statusLabel(undefined), null);
    for (const s of ["active", "in_transit", "boarding", "departed", "delayed", "cancelled"]) assert.ok(!/live/i.test(statusLabel(s)!.text));
  });

  it("builds the details link passenger-web's cards build", () => {
    assert.equal(detailPath(bus({}), "a", "b", "2026-09-30"), null);
    assert.equal(detailPath(bus({ scheduleId: "s1" }), "", "b"), null);
    const p = new URL(detailPath(bus({ scheduleId: "s1", tripId: "t1" }), "from1", "to1", "2026-09-30")!, "http://x");
    assert.equal(p.pathname, "/findmybus/detail");
    assert.deepEqual(Object.fromEntries(p.searchParams), { scheduleId: "s1", fromStopId: "from1", toStopId: "to1", tripId: "t1", date: "2026-09-30" });
    assert.equal(new URL(detailPath(bus({ scheduleId: "s1" }), "f", "t")!, "http://x").searchParams.has("tripId"), false);
  });

  it("reads the search query, defaulting a missing or invalid date to today", () => {
    const p = readSearchParams("?fromStopId=a&toStopId=b&fromName=Colombo+Fort&toName=Kandy&date=2026-10-01", "2026-09-30");
    assert.equal(p.fromStopId, "a");
    assert.equal(p.fromName, "Colombo Fort");
    assert.equal(p.date, "2026-10-01");
    assert.equal(readSearchParams("?fromText=Col&toText=Kan&date=garbage", "2026-09-30").date, "2026-09-30");
    assert.equal(readSearchParams("", "2026-09-30").fromStopId, "");
    assert.equal(readSearchParams("?fromText=Col", "2026-09-30").fromText, "Col");
  });
});

describe("INC-066 typed stop names", () => {
  const c = (id: string, name: string, city = name): StopCandidate => ({ id, name, city });
  const colomboFort = c("1", "Colombo Fort (Central Bus Stand)", "Colombo");
  const kadawatha = c("2", "Kadawatha");
  const kegalle = c("3", "Kegalle");
  const kandy = c("4", "Kandy (Goods Shed Bus Stand)", "Kandy");

  it("takes a lone candidate", () => {
    assert.deepEqual(resolveStopText("Kandi", [kandy]), { kind: "match", stop: kandy });
  });

  it("takes an exact name, in any case", () => {
    assert.deepEqual(resolveStopText(" kegalle ", [kadawatha, kegalle, kandy]), { kind: "match", stop: kegalle });
  });

  it("takes the only name or town that starts with the text", () => {
    assert.deepEqual(resolveStopText("Colombo", [colomboFort, kadawatha, kegalle]), { kind: "match", stop: colomboFort });
    assert.deepEqual(resolveStopText("Kand", [kadawatha, kegalle, kandy]), { kind: "match", stop: kandy });
  });

  it("asks when it can't be sure, and never guesses", () => {
    const r = resolveStopText("Ka", [kadawatha, kegalle, kandy]);
    assert.equal(r.kind, "ambiguous");
    assert.deepEqual((r as { options: StopCandidate[] }).options.map((o) => o.id), ["2", "4"]);
    const dup = resolveStopText("Kandy", [c("7", "Kandy", "Kandy"), c("8", "Kandy", "Kandy")]);
    assert.equal(dup.kind, "ambiguous");
    assert.equal(resolveStopText("xyz", [kadawatha, kegalle]).kind, "ambiguous");
  });

  it("says none when there is nothing to choose from", () => {
    assert.deepEqual(resolveStopText("Nowhere", []), { kind: "none" });
    assert.deepEqual(resolveStopText("  ", [kandy]), { kind: "none" });
  });
});

describe("INC-066 wording helpers", () => {
  it("spells dates the same on every phone", () => {
    assert.equal(formatLongDate("2026-09-30"), "Wed, 30 Sep 2026");
    assert.equal(formatLongDate("2027-01-01"), "Fri, 1 Jan 2027");
    assert.equal(formatDayName("2026-10-05"), "Monday 5 October");
  });

  it("shortens a stop to its town-level name only when a bracket is trailing", () => {
    assert.equal(shortStopName("Colombo Fort (Central Bus Stand)"), "Colombo Fort");
    assert.equal(shortStopName("Kandy (Goods Shed Bus Stand)"), "Kandy");
    assert.equal(shortStopName("Kadawatha"), "Kadawatha");
    assert.equal(shortStopName("(Depot)"), "(Depot)");
    assert.equal(shortStopName("Galle (Bus Stand) Junction"), "Galle (Bus Stand) Junction");
  });

  it("toggles a value in a list without touching the original", () => {
    const a = ["x"];
    assert.deepEqual(toggle(a, "y"), ["x", "y"]);
    assert.deepEqual(toggle(a, "x"), []);
    assert.deepEqual(a, ["x"]);
  });

  it("offers more filters only when there is a real choice", () => {
    const one = bus({ routeNumber: "01" });
    assert.equal(hasExtraFilters([one, bus({ routeNumber: "01" })]), false);
    assert.equal(hasExtraFilters([one, bus({ routeNumber: "02" })]), true);
    assert.equal(hasExtraFilters([one, bus({ routeNumber: "01", roadType: "EXPRESSWAY" })]), true);
  });
});

describe("INC-066 cancelled buses", () => {
  it("recognises both spellings of cancelled", () => {
    assert.equal(isCancelled(bus({ tripStatus: "cancelled" })), true);
    assert.equal(isCancelled(bus({ tripStatus: "Canceled" })), true);
    assert.equal(isCancelled(bus({ tripStatus: "active" })), false);
    assert.equal(isCancelled(bus({})), false);
  });

  it("puts cancelled buses after running ones without reordering either group", () => {
    const list = [bus({ routeNumber: "A", tripStatus: "cancelled" }), bus({ routeNumber: "B" }), bus({ routeNumber: "C", tripStatus: "cancelled" }), bus({ routeNumber: "D", tripStatus: "active" })];
    assert.deepEqual(cancelledLast(list).map((b) => b.routeNumber), ["B", "D", "A", "C"]);
    assert.deepEqual(list.map((b) => b.routeNumber), ["A", "B", "C", "D"]);
  });
});

