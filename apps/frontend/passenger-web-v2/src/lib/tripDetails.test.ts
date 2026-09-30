import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bookingState,
  daysPhrase,
  dateStatus,
  hasRequiredParams,
  operatingDays,
  readDetailParams,
  resultsPath,
  seatsPath,
  sortExceptions,
  stopRows,
  visibleRows,
  type StopLike,
} from "./tripDetails.ts";
import { detailPath } from "./findMyBus.ts";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

describe("INC-067 the link", () => {
  it("reads what findMyBus's detailPath writes", () => {
    const path = detailPath({ scheduleId: "s1", tripId: "t1" }, A, B, "2026-10-01")!;
    const p = readDetailParams(path.slice(path.indexOf("?")), "2026-09-30");
    assert.deepEqual(p, { scheduleId: "s1", fromStopId: A, toStopId: B, tripId: "t1", date: "2026-10-01" });
  });

  it("defaults a missing or invalid date to today and a missing trip to empty", () => {
    assert.equal(readDetailParams(`?scheduleId=s&fromStopId=${A}&toStopId=${B}&date=nope`, "2026-09-30").date, "2026-09-30");
    assert.equal(readDetailParams(`?scheduleId=s&fromStopId=${A}&toStopId=${B}`, "2026-09-30").tripId, "");
  });

  it("needs a schedule and two real stop ids", () => {
    assert.equal(hasRequiredParams(readDetailParams(`?scheduleId=s&fromStopId=${A}&toStopId=${B}`, "d")), true);
    assert.equal(hasRequiredParams(readDetailParams(`?fromStopId=${A}&toStopId=${B}`, "d")), false);
    assert.equal(hasRequiredParams(readDetailParams(`?scheduleId=s&fromStopId=abc&toStopId=${B}`, "d")), false);
    assert.equal(hasRequiredParams(readDetailParams("", "d")), false);
  });

  it("builds the way back to the results", () => {
    const u = new URL(resultsPath({ fromStopId: A, toStopId: B, fromName: "Colombo Fort", toName: "Kandy", date: "2026-10-01" }), "http://x");
    assert.equal(u.pathname, "/findmybus");
    assert.deepEqual(Object.fromEntries(u.searchParams), { fromStopId: A, toStopId: B, fromName: "Colombo Fort", toName: "Kandy", date: "2026-10-01" });
    assert.equal(new URL(resultsPath({ fromStopId: A, toStopId: B, date: "2026-10-01" }), "http://x").searchParams.has("fromName"), false);
  });
});

describe("INC-067 stops", () => {
  const s = (order: number, name: string, extra: Partial<StopLike> = {}): StopLike => ({ stopOrder: order, stop: { id: `id${order}`, name }, ...extra });
  const route: StopLike[] = [
    s(3, "Kegalle", { resolvedArrivalTime: "08:35:00", resolvedDepartureTime: "08:45:00", distanceFromStartKm: 78 }),
    s(1, "Colombo", { resolvedDepartureTime: "06:00:00", distanceFromStartKm: 0 }),
    s(2, "Kadawatha", { isOrigin: true, resolvedArrivalTime: "06:22:00", resolvedDepartureTime: "06:22:00", distanceFromStartKm: 12 }),
    s(4, "Kandy", { isDestination: true, resolvedArrivalTime: "09:45:00" }),
    s(5, "Peradeniya", { resolvedArrivalTime: "10:05:00" }),
  ];

  it("orders stops and marks the passenger's journey from the server's flags", () => {
    const rows = stopRows(route);
    assert.deepEqual(rows.map((r) => r.stop.stop!.name), ["Colombo", "Kadawatha", "Kegalle", "Kandy", "Peradeniya"]);
    assert.deepEqual(rows.map((r) => r.role), ["outside", "origin", "between", "destination", "outside"]);
  });

  it("falls back to the summary's stop orders, then to the stop ids", () => {
    const plain = route.map(({ isOrigin, isDestination, ...rest }) => rest);
    assert.deepEqual(stopRows(plain, { originOrder: 2, destinationOrder: 4 }).map((r) => r.role), ["outside", "origin", "between", "destination", "outside"]);
    assert.deepEqual(stopRows(plain, { fromStopId: "id2", toStopId: "id4" }).map((r) => r.role), ["outside", "origin", "between", "destination", "outside"]);
    assert.deepEqual(stopRows(plain).map((r) => r.role), ["between", "between", "between", "between", "between"]);
  });

  it("works out the time to show, the wait, and the distance", () => {
    const rows = stopRows(route);
    assert.equal(rows[2].main, 8 * 60 + 45); // leaves at 8:45
    assert.equal(rows[2].haltMinutes, 10);
    assert.equal(rows[1].haltMinutes, null); // arrives and leaves together
    assert.equal(rows[3].main, 9 * 60 + 45); // last stop: arrival only
    assert.equal(rows[0].km, 0); // a distance of zero is a distance, not a gap
    assert.equal(rows[3].km, null);
  });

  it("shows only the journey by default and the whole route on request", () => {
    const rows = stopRows(route);
    assert.deepEqual(visibleRows(rows, false).map((r) => r.stop.stop!.name), ["Kadawatha", "Kegalle", "Kandy"]);
    assert.equal(visibleRows(rows, true).length, 5);
  });

  it("never hides everything when no journey is marked", () => {
    const plain = stopRows(route.map(({ isOrigin, isDestination, ...rest }) => rest));
    assert.equal(visibleRows(plain, false).length, 5);
    assert.deepEqual(stopRows(undefined), []);
  });
});

describe("INC-067 operating days", () => {
  it("lists the days in week order", () => {
    assert.deepEqual(operatingDays({ friday: true, monday: true, sunday: true }), ["Mon", "Fri", "Sun"]);
    assert.deepEqual(operatingDays(null), []);
  });

  it("puts common patterns in words", () => {
    assert.equal(daysPhrase(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]), "Every day");
    assert.equal(daysPhrase(["Mon", "Tue", "Wed", "Thu", "Fri"]), "Weekdays");
    assert.equal(daysPhrase(["Sat", "Sun"]), "Weekends");
    assert.equal(daysPhrase(["Mon", "Wed"]), "Mon, Wed");
    assert.equal(daysPhrase([]), "");
  });

  it("never guesses whether it runs when the days were never stated", () => {
    assert.equal(dateStatus(true), "runs");
    assert.equal(dateStatus(false), "no");
    assert.equal(dateStatus(null), "unstated");
    assert.equal(dateStatus(undefined), "unstated");
  });

  it("lists exceptions that touch the date first, then by date, without changing the input", () => {
    const list = [{ exceptionDate: "2026-12-25" }, { exceptionDate: "2026-11-01", affectsQueryDate: true }, { exceptionDate: "2026-10-01" }];
    assert.deepEqual(sortExceptions(list).map((e) => e.exceptionDate), ["2026-11-01", "2026-10-01", "2026-12-25"]);
    assert.equal(list[0].exceptionDate, "2026-12-25");
    assert.deepEqual(sortExceptions(undefined), []);
  });
});

describe("INC-067 booking entry", () => {
  const today = "2026-09-30";
  const trip = (status: string, busId: string | null = "bus1") => ({ trip: { tripId: "t1", status, bus: busId ? { busId } : undefined } });

  it("opens for a bus-assigned trip that has not left", () => {
    for (const s of ["pending", "active", "boarding", "delayed"]) assert.deepEqual(bookingState(trip(s), today, today), { kind: "open", tripId: "t1", busId: "bus1" });
  });

  it("says why it can't be booked", () => {
    assert.equal(bookingState({}, today, today).kind, "no-bus");
    assert.equal(bookingState({ trip: null }, today, today).kind, "no-bus");
    assert.equal(bookingState(trip("pending", null), today, today).kind, "no-bus");
    assert.equal(bookingState({ trip: { status: "pending", bus: { busId: "b" } } }, today, today).kind, "no-bus");
    assert.equal(bookingState(trip("cancelled"), today, today).kind, "cancelled");
    assert.equal(bookingState(trip("Canceled"), today, today).kind, "cancelled");
    for (const s of ["completed", "departed", "in_transit"]) assert.equal(bookingState(trip(s), today, today).kind, "left");
  });

  it("a past date is never bookable, whatever the trip says", () => {
    assert.equal(bookingState(trip("pending"), "2026-09-29", today).kind, "past-date");
    assert.equal(bookingState(trip("pending"), "2026-10-01", today).kind, "open");
  });

  it("builds the link seat selection reads, leaving out what is missing", () => {
    const u = new URL(seatsPath({ tripId: "t1", busId: "b1", fromStopId: A, toStopId: B, fromStopName: "Colombo Fort", tripDate: "2026-10-01", operatorName: "" }), "http://x");
    assert.equal(u.pathname, "/booking/seats");
    assert.deepEqual(Object.fromEntries(u.searchParams), { tripId: "t1", busId: "b1", fromStopId: A, toStopId: B, fromStopName: "Colombo Fort", tripDate: "2026-10-01" });
  });
});
