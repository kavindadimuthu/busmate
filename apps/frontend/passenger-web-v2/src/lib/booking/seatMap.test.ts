import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultLayout, dropUnavailable, layoutSeats, MAX_SEATS_PER_BOOKING, resolveLayout, seatState, sortSeats, toggleSeat } from "./seatMap.ts";

const none = new Set<string>();

describe("INC-069 the seat layout", () => {
  it("numbers a default 2+2 layout 1..capacity, in rows of four", () => {
    const l = defaultLayout(10);
    assert.deepEqual(l.rows[0], { left: ["1", "2"], right: ["3", "4"] });
    assert.deepEqual(l.rows[2], { left: ["9", "10"], right: [] });
    assert.equal(layoutSeats(l).length, 10);
  });

  it("uses the bus's own layout when it has rows, else a default, else nothing", () => {
    const own = { rows: [{ left: ["A1"], right: ["A2"] }] };
    assert.equal(resolveLayout(own, 40), own);
    assert.equal(resolveLayout({ rows: [] }, 4)?.rows.length, 1);
    assert.equal(resolveLayout(null, 4)?.rows.length, 1);
    assert.equal(resolveLayout(undefined, 0), null);
    assert.equal(resolveLayout({}, undefined), null);
  });

  it("lists every seat front to back, including the back row", () => {
    assert.deepEqual(layoutSeats({ rows: [{ left: ["1"], right: ["2"] }, { back: ["3", "4", "5"] }] }), ["1", "2", "3", "4", "5"]);
  });
});

describe("INC-069 picking seats", () => {
  it("a seat is blocked, taken, selected or available, in that order of precedence", () => {
    const taken = new Set(["2", "3"]);
    const blocked = new Set(["3", "4"]);
    assert.equal(seatState("3", taken, ["3"], blocked), "blocked");
    assert.equal(seatState("2", taken, ["2"], blocked), "taken");
    assert.equal(seatState("1", taken, ["1"], blocked), "selected");
    assert.equal(seatState("5", taken, ["1"], blocked), "available");
  });

  it("picks and un-picks", () => {
    const a = toggleSeat([], "1", none, none);
    assert.deepEqual(a.selected, ["1"]);
    assert.deepEqual(toggleSeat(a.selected, "1", none, none).selected, []);
  });

  it("refuses a taken or blocked seat and says so, leaving the picks alone", () => {
    assert.deepEqual(toggleSeat(["1"], "2", new Set(["2"]), none), { selected: ["1"], refused: "unavailable" });
    assert.deepEqual(toggleSeat(["1"], "2", none, new Set(["2"])), { selected: ["1"], refused: "unavailable" });
  });

  it("stops at the limit, but still lets a picked seat be un-picked", () => {
    const five = ["1", "2", "3", "4", "5"];
    assert.equal(MAX_SEATS_PER_BOOKING, 5);
    assert.deepEqual(toggleSeat(five, "6", none, none), { selected: five, refused: "limit" });
    assert.deepEqual(toggleSeat(five, "5", none, none).selected, ["1", "2", "3", "4"]);
  });

  it("does not change the array it was given", () => {
    const picks = ["1"];
    toggleSeat(picks, "2", none, none);
    assert.deepEqual(picks, ["1"]);
  });

  it("drops picks that became unavailable and reports which", () => {
    assert.deepEqual(dropUnavailable(["1", "2", "3"], new Set(["2"]), new Set(["3"])), { selected: ["1"], dropped: ["2", "3"] });
    assert.deepEqual(dropUnavailable(["1"], none, none), { selected: ["1"], dropped: [] });
  });

  it("sorts seats by number where they are numbers", () => {
    assert.deepEqual(sortSeats(["10", "2", "1"]), ["1", "2", "10"]);
    assert.deepEqual(sortSeats(["B2", "A10", "A2"]), ["A2", "A10", "B2"]);
  });
});
