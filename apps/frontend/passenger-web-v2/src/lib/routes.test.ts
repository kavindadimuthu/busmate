import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countLabel, filterRoutes, formatKm, orderedStops, otherDirections, roadTypeLabel, roadTypeOptions, sortRoutes, stopCount, type RouteLike } from "./routes.ts";

const r = (over: Partial<RouteLike>): RouteLike => ({ id: "x", routeNumber: "01", name: "Colombo Fort to Kandy", roadType: "NORMALWAY", ...over });
const ROUTES: RouteLike[] = [
  r({ id: "a", routeNumber: "01", name: "Colombo Fort to Kandy", routeThrough: "Kadawatha, Kegalle", routeGroupId: "g1", startStopName: "Colombo Fort", endStopName: "Kandy", distanceKm: 115, routeStops: [{ stopName: "Kadawatha" }, { stopName: "Kegalle" }] }),
  r({ id: "b", routeNumber: "01", name: "Kandy to Colombo Fort", routeThrough: "Kegalle, Kadawatha", routeGroupId: "g1", startStopName: "Kandy", endStopName: "Colombo Fort", distanceKm: 115 }),
  r({ id: "c", routeNumber: "02", name: "Colombo Fort to Galle", roadType: "EXPRESSWAY", routeThrough: "Kalutara", routeGroupId: "g2", distanceKm: 119 }),
  r({ id: "d", routeNumber: "10", name: "Colombo Fort to Negombo", routeGroupId: "g3", distanceKm: 37 }),
  r({ id: "e", routeNumber: "9", name: "Somewhere to Elsewhere", routeGroupId: undefined, distanceKm: undefined }),
];

describe("INC-074 finding routes", () => {
  it("finds by number, name, a town it goes through, or any stop, in any case", () => {
    assert.deepEqual(filterRoutes(ROUTES, { query: "GALLE", roadType: "" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "kalutara", roadType: "" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "kegalle", roadType: "" }).map((x) => x.id), ["a", "b"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "10", roadType: "" }).map((x) => x.id), ["d"]);
  });

  it("matches the start of a word, not the middle of one", () => {
    assert.deepEqual(filterRoutes(ROUTES, { query: "gal", roadType: "" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "galle", roadType: "" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "egalle", roadType: "" }), []);
    assert.deepEqual(filterRoutes(ROUTES, { query: "col", roadType: "" }).map((x) => x.id), ["a", "b", "c", "d"]);
  });

  it("needs every word, so 'kandy 01' narrows and 'kandy galle' finds nothing", () => {
    assert.deepEqual(filterRoutes(ROUTES, { query: "kandy 01", roadType: "" }).map((x) => x.id), ["a", "b"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "kandy galle", roadType: "" }), []);
  });

  it("ignores extra spaces, and an empty search shows everything", () => {
    assert.equal(filterRoutes(ROUTES, { query: "   ", roadType: "" }).length, 5);
    assert.deepEqual(filterRoutes(ROUTES, { query: "  negombo   ", roadType: "" }).map((x) => x.id), ["d"]);
  });

  it("narrows by road type, together with the search", () => {
    assert.deepEqual(filterRoutes(ROUTES, { query: "", roadType: "EXPRESSWAY" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "colombo", roadType: "EXPRESSWAY" }).map((x) => x.id), ["c"]);
    assert.deepEqual(filterRoutes(ROUTES, { query: "kandy", roadType: "EXPRESSWAY" }), []);
  });

  it("does not change the list it was given", () => {
    const copy = [...ROUTES];
    filterRoutes(ROUTES, { query: "x", roadType: "" });
    sortRoutes(ROUTES, "longest");
    assert.deepEqual(ROUTES, copy);
  });
});

describe("INC-074 sorting routes", () => {
  it("sorts by route number as numbers, so 9 comes before 10", () => {
    assert.deepEqual(sortRoutes(ROUTES, "number").map((x) => x.id), ["a", "b", "c", "e", "d"]);
  });

  it("sorts by distance either way, keeping route order for ties, and puts unknown lengths last both ways", () => {
    assert.deepEqual(sortRoutes(ROUTES, "shortest").map((x) => x.id), ["d", "a", "b", "c", "e"]);
    assert.deepEqual(sortRoutes(ROUTES, "longest").map((x) => x.id), ["c", "a", "b", "d", "e"]);
  });
});

describe("INC-074 road types, directions and words", () => {
  it("words the road types it knows and shows others as written", () => {
    assert.equal(roadTypeLabel("NORMALWAY"), "Normal road");
    assert.equal(roadTypeLabel("EXPRESSWAY"), "Expressway");
    assert.equal(roadTypeLabel("SEMI_LUXURY"), "SEMI_LUXURY");
    assert.equal(roadTypeLabel(undefined), null);
  });

  it("offers only the road types that exist, with counts, normal road first", () => {
    assert.deepEqual(roadTypeOptions(ROUTES), [{ id: "NORMALWAY", label: "Normal road", count: 4 }, { id: "EXPRESSWAY", label: "Expressway", count: 1 }]);
    assert.deepEqual(roadTypeOptions([r({ roadType: undefined })]), []);
  });

  it("finds the same route going the other way through its group", () => {
    assert.deepEqual(otherDirections(ROUTES, ROUTES[0]).map((x) => x.id), ["b"]);
    assert.deepEqual(otherDirections(ROUTES, ROUTES[2]), []);
    assert.deepEqual(otherDirections(ROUTES, ROUTES[4]), []);
  });

  it("counts stops and routes, and writes distances plainly", () => {
    assert.equal(stopCount(ROUTES[0]), 2);
    assert.equal(stopCount(ROUTES[1]), 0);
    assert.equal(countLabel(1), "1 route");
    assert.equal(countLabel(0), "0 routes");
    assert.equal(countLabel(6), "6 routes");
    assert.equal(formatKm(115), "115 km");
    assert.equal(formatKm(37.5), "37.5 km");
    assert.equal(formatKm(undefined), null);
    assert.equal(formatKm(-3), null);
  });

  it("puts stops in running order, unordered ones last", () => {
    const stops = [{ stopName: "C", stopOrder: 3 }, { stopName: "X" }, { stopName: "A", stopOrder: 1 }, { stopName: "B", stopOrder: 2 }];
    assert.deepEqual(orderedStops(stops).map((s) => s.stopName), ["A", "B", "C", "X"]);
  });
});
