import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canCancel, groupTickets, qrPayload, sectionOf, showsQr, sortGroups, statusInfo, type TicketLike } from "./tickets.ts";

const t = (id: number, seat: string, over: Partial<TicketLike> = {}): TicketLike => ({ ticketId: id, tripId: "trip-1", startLocationId: "A", endLocationId: "B", seatNumber: seat, bookingStatus: "CONFIRMED", ...over });

describe("INC-071 grouping tickets by trip", () => {
  it("puts one booking's seats together, sorted by seat number", () => {
    const g = groupTickets([t(3, "10"), t(1, "2"), t(2, "1")]);
    assert.equal(g.length, 1);
    assert.deepEqual(g[0].tickets.map((x) => x.seatNumber), ["1", "2", "10"]);
  });

  it("keeps different trips, or different stops on the same trip, apart", () => {
    assert.equal(groupTickets([t(1, "1"), t(2, "1", { tripId: "trip-2" })]).length, 2);
    assert.equal(groupTickets([t(1, "1"), t(2, "2", { endLocationId: "C" })]).length, 2);
  });

  it("leaves a ticket with no trip on its own", () => {
    assert.equal(groupTickets([t(1, "1", { tripId: undefined }), t(2, "2", { tripId: undefined })]).length, 2);
  });

  it("handles no tickets", () => {
    assert.deepEqual(groupTickets([]), []);
  });
});

describe("INC-071 what a status means", () => {
  it("words every status BusMate has, and shows an unknown one as it is", () => {
    assert.equal(statusInfo("CONFIRMED").label, "Confirmed");
    assert.equal(statusInfo("PENDING_PAYMENT").label, "Awaiting payment");
    assert.equal(statusInfo("PAYMENT_FAILED").label, "Payment failed");
    assert.equal(statusInfo("BOARDED").label, "Boarded");
    assert.equal(statusInfo("CANCELLED").label, "Cancelled");
    assert.equal(statusInfo("SOMETHING_NEW").label, "SOMETHING_NEW");
    assert.equal(statusInfo(undefined).label, "Unknown");
  });

  it("never says a confirmed ticket was paid: nothing here can know that", () => {
    assert.ok(!/paid/i.test(statusInfo("CONFIRMED").meaning));
  });

  it("lets a passenger cancel only a booking that isn't complete", () => {
    assert.equal(canCancel("PENDING_PAYMENT"), true);
    assert.equal(canCancel("PAYMENT_FAILED"), true);
    assert.equal(canCancel("CONFIRMED"), false);
    assert.equal(canCancel("BOARDED"), false);
    assert.equal(canCancel("CANCELLED"), false);
    assert.equal(canCancel(undefined), false);
  });

  it("shows the boarding QR only for a booked or used ticket", () => {
    assert.equal(showsQr("CONFIRMED"), true);
    assert.equal(showsQr("BOARDED"), true);
    assert.equal(showsQr("PENDING_PAYMENT"), false);
    assert.equal(showsQr("CANCELLED"), false);
  });
});

describe("INC-071 upcoming and past", () => {
  const [g] = groupTickets([t(1, "1")]);
  const [dead] = groupTickets([t(1, "1", { bookingStatus: "CANCELLED" })]);

  it("a live ticket on or after today is upcoming", () => {
    assert.equal(sectionOf(g, { tripDate: "2026-10-02", status: "pending" }, "2026-09-30"), "upcoming");
    assert.equal(sectionOf(g, { tripDate: "2026-09-30", status: "pending" }, "2026-09-30"), "upcoming");
  });

  it("a passed date, a cancelled or completed trip, or only dead tickets are past", () => {
    assert.equal(sectionOf(g, { tripDate: "2026-09-29" }, "2026-09-30"), "past");
    assert.equal(sectionOf(g, { tripDate: "2026-10-02", status: "cancelled" }, "2026-09-30"), "past");
    assert.equal(sectionOf(g, { tripDate: "2026-10-02", status: "completed" }, "2026-09-30"), "past");
    assert.equal(sectionOf(dead, { tripDate: "2026-10-02" }, "2026-09-30"), "past");
  });

  it("a ticket whose trip hasn't loaded is upcoming, never hidden", () => {
    assert.equal(sectionOf(g, undefined, "2026-09-30"), "upcoming");
  });

  it("one live seat keeps the whole trip upcoming", () => {
    const [mixed] = groupTickets([t(1, "1", { bookingStatus: "CANCELLED" }), t(2, "2")]);
    assert.equal(sectionOf(mixed, { tripDate: "2026-10-02" }, "2026-09-30"), "upcoming");
  });

  it("sorts upcoming soonest first, past latest first, undated last", () => {
    const groups = [{ key: "b", d: "2026-10-05" }, { key: "x", d: undefined }, { key: "a", d: "2026-10-02" }] as unknown as ReturnType<typeof groupTickets>;
    const dateOf = (x: { key: string }) => ({ a: "2026-10-02", b: "2026-10-05", x: undefined })[x.key as "a"];
    assert.deepEqual(sortGroups(groups, dateOf, "upcoming").map((x) => x.key), ["a", "b", "x"]);
    assert.deepEqual(sortGroups(groups, dateOf, "past").map((x) => x.key), ["b", "a", "x"]);
  });
});

describe("INC-071 the boarding QR", () => {
  it("has the keys the conductor's scanner reads", () => {
    const p = JSON.parse(qrPayload({ ticketId: 24, passengerName: "Nimal", startStation: "Colombo Fort", endStation: "Kandy", seatNumber: "7", fareAmount: 45, bookingStatus: "CONFIRMED", tripDate: "2026-10-02", departureTime: "06:00:00", busPlateNumber: "WP CAB-7734" }));
    assert.deepEqual(Object.keys(p).sort(), ["busPlateNumber", "departureTime", "endStation", "passengerCount", "passengerName", "paymentStatus", "seatNumber", "startStation", "ticketFee", "ticketId", "tripDate"]);
    assert.equal(p.ticketFee, 45);
    assert.equal(p.paymentStatus, "CONFIRMED");
  });

  it("defaults the name and the passenger count", () => {
    const p = JSON.parse(qrPayload({ ticketId: 1 }));
    assert.equal(p.passengerName, "Passenger");
    assert.equal(p.passengerCount, 1);
  });
});
