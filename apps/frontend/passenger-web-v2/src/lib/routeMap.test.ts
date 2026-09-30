import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { boundsOf, canDraw, journeyOf, missingNote, routePoints, tripPoints } from "./routeMap.ts";

const loc = (latitude: number, longitude: number) => ({ latitude, longitude });

describe("a route's points", () => {
  const stops = [
    { stopName: "Colombo", location: loc(6.9355, 79.8487) },
    { stopName: "Kadawatha", location: loc(7.0008, 79.9511) },
    { stopName: "Kandy", location: loc(7.2931, 80.635) },
  ];
  it("marks the first as the start and the last as the end", () => {
    const m = routePoints(stops);
    assert.deepEqual(m.points.map((p) => p.role), ["origin", "between", "destination"]);
    assert.equal(m.missing, 0);
    assert.equal(missingNote(m), null);
    assert.ok(canDraw(m));
  });
  it("leaves out a stop with no position and says so", () => {
    const m = routePoints([stops[0], { stopName: "Nowhere" }, stops[2]]);
    assert.equal(m.points.length, 2);
    assert.equal(m.missing, 1);
    assert.equal(missingNote(m), "2 of 3 stops have a known position, so only those are shown.");
  });
  it("does not promote a stop to the start when the real start has no position", () => {
    const m = routePoints([{ stopName: "A" }, stops[1], stops[2]]);
    assert.equal(m.points[0].role, "between"); // A is missing, so Kadawatha is drawn as a stop, not as the start
    assert.equal(m.points[1].role, "destination");
  });
  it("treats a position outside Sri Lanka as missing, not as a stop to draw", () => {
    const m = routePoints([stops[0], { stopName: "Bad", location: loc(0, 0) }, stops[2]]);
    assert.equal(m.points.length, 2);
    assert.equal(m.missing, 1);
  });
  it("refuses a partial position", () => {
    assert.equal(routePoints([{ stopName: "X", location: { latitude: 7 } }]).points.length, 0);
  });
  it("cannot draw a route from fewer than two points", () => {
    assert.equal(canDraw(routePoints([stops[0]])), false);
    assert.equal(canDraw(routePoints([])), false);
  });
});

describe("a trip's points", () => {
  const rows = [
    { role: "outside" as const, stop: { stop: { name: "Before", location: loc(6.9, 79.85) } } },
    { role: "origin" as const, stop: { stop: { name: "Board", location: loc(7.0, 79.95) } } },
    { role: "between" as const, stop: { stop: { name: "Mid", location: loc(7.1, 80.1) } } },
    { role: "destination" as const, stop: { stop: { name: "Off", location: loc(7.29, 80.63) } } },
    { role: "outside" as const, stop: { stop: { name: "After" } } },
  ];
  it("keeps every role and counts the stop with no position", () => {
    const m = tripPoints(rows);
    assert.equal(m.points.length, 4);
    assert.equal(m.missing, 1);
    assert.equal(m.total, 5);
  });
  it("the journey is only from boarding to getting off", () => {
    assert.deepEqual(journeyOf(tripPoints(rows).points).map((p) => p.name), ["Board", "Mid", "Off"]);
  });
});

describe("bounds", () => {
  it("wraps the points", () => {
    assert.deepEqual(boundsOf([{ lat: 7, lng: 80 }, { lat: 6.5, lng: 81 }]), { south: 6.5, west: 80, north: 7, east: 81 });
  });
  it("is null for none", () => assert.equal(boundsOf([]), null));
});
