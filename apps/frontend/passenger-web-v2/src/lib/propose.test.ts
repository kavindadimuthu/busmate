import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  changedStopFields,
  checkDay,
  checkPosition,
  correctionProblems,
  correctionRequest,
  emptyCorrectionForm,
  emptyStopForm,
  emptyWorkingForm,
  formatCoordinate,
  inSriLanka,
  parseCoordinate,
  parsePlates,
  stopFormFrom,
  stopProblems,
  stopRequest,
  workingProblems,
  workingRequest,
  type StopForm,
  type StopTarget,
} from "./propose.ts";

const TODAY = "2026-10-05";

describe("INC-080 position", () => {
  it("reads plain decimal numbers and nothing else", () => {
    assert.equal(parseCoordinate("7.29"), 7.29);
    assert.equal(parseCoordinate(" 80.63000 "), 80.63);
    assert.equal(parseCoordinate("-1.5"), -1.5);
    assert.equal(parseCoordinate("7"), 7);
    for (const bad of ["", "abc", "7,29", "7.29°", "1e3", "7.", ".5", "7.2.9", "NaN", "Infinity"]) assert.equal(parseCoordinate(bad), null, bad);
    assert.equal(formatCoordinate(7.2), "7.20000");
  });

  it("knows what is in Sri Lanka, edges included", () => {
    assert.equal(inSriLanka(7.29, 80.63), true);
    assert.equal(inSriLanka(6.93, 79.85), true);
    assert.equal(inSriLanka(5.6, 79.4), true);
    assert.equal(inSriLanka(10.2, 80), false);
    assert.equal(inSriLanka(13.08, 80.27), false); // Chennai
    assert.equal(inSriLanka(51.5, -0.12), false);
  });

  it("asks for a position when there is none, and for both numbers when there is one", () => {
    assert.deepEqual(checkPosition("", ""), { ok: false, message: "Place the stop: use your location, tap the map, or type the coordinates." });
    assert.match((checkPosition("7.29", "") as { message: string }).message, /both coordinates/);
    assert.match((checkPosition("abc", "80.6") as { message: string }).message, /plain numbers/);
  });

  it("catches swapped numbers, a position outside Sri Lanka, and impossible values", () => {
    assert.match((checkPosition("80.63", "7.29") as { message: string }).message, /wrong way round/);
    assert.match((checkPosition("13.08", "80.27") as { message: string }).message, /isn't in Sri Lanka/);
    assert.match((checkPosition("95", "80") as { message: string }).message, /valid coordinates/);
    assert.deepEqual(checkPosition("7.29", "80.63"), { ok: true, lat: 7.29, lng: 80.63 });
  });
});

describe("INC-080 days and plates", () => {
  it("accepts a real day up to today, and refuses the future, junk and impossible dates", () => {
    assert.equal(checkDay("2026-10-05", TODAY), null);
    assert.equal(checkDay("2026-01-01", TODAY), null);
    assert.equal(checkDay("2026-10-06", TODAY), "That day hasn't happened yet.");
    assert.equal(checkDay("", TODAY), "Say the day you saw it.");
    assert.equal(checkDay("", TODAY, "it last ran"), "Say the day it last ran.");
    for (const bad of ["not a date", "2026-13-01", "2026-02-30", "26-10-05", "1999-12-31"]) assert.equal(checkDay(bad, TODAY), "Enter a real date.", bad);
  });

  it("splits plates on commas, semicolons and lines, trims them and drops repeats", () => {
    assert.deepEqual(parsePlates("ND-1712, ND-1713"), { plates: ["ND-1712", "ND-1713"], problem: null });
    assert.deepEqual(parsePlates(" ND-1712 ;nd-1712\n ND-1714 ,, "), { plates: ["ND-1712", "ND-1714"], problem: null });
    assert.deepEqual(parsePlates(""), { plates: [], problem: null });
  });

  it("refuses more than ten plates, or one over 32 characters", () => {
    assert.equal(parsePlates(Array.from({ length: 11 }, (_, i) => `P-${i}`).join(",")).problem, "Ten plates at most.");
    assert.equal(parsePlates(Array.from({ length: 10 }, (_, i) => `P-${i}`).join(",")).problem, null);
    assert.equal(parsePlates("X".repeat(33)).problem, "Each plate must be 32 characters or fewer.");
  });
});

describe("INC-080 proposing a stop", () => {
  const good: StopForm = { ...emptyStopForm(TODAY), name: "Kadawatha Junction", latitude: "7.00100", longitude: "79.95000", observationMethod: "RODE_THE_ROUTE" };

  it("needs a name, a position in Sri Lanka, a real day and how you know", () => {
    assert.deepEqual(stopProblems(good, { today: TODAY, target: null }), {});
    const p = stopProblems({ ...good, name: " ", latitude: "", longitude: "", observedOn: "2027-01-01", observationMethod: "" }, { today: TODAY, target: null });
    assert.deepEqual(Object.keys(p).sort(), ["name", "observationMethod", "observedOn", "position"]);
  });

  it("keeps the note within 500 characters", () => {
    assert.equal(stopProblems({ ...good, note: "x".repeat(501) }, { today: TODAY, target: null }).note, "Keep the note under 500 characters.");
    assert.deepEqual(stopProblems({ ...good, note: "x".repeat(500) }, { today: TODAY, target: null }), {});
  });

  it("builds the request without blank optional fields", () => {
    const r = stopRequest({ ...good, nameSinhala: "  ", city: " Kadawatha ", isAccessible: true, note: "  " }, undefined, false);
    assert.deepEqual(r, {
      targetStopId: undefined,
      name: "Kadawatha Junction",
      nameSinhala: undefined,
      nameTamil: undefined,
      description: undefined,
      location: { latitude: 7.001, longitude: 79.95, city: "Kadawatha" },
      isAccessible: true,
      observedOn: TODAY,
      observationMethod: "RODE_THE_ROUTE",
      note: undefined,
      confirmDuplicate: false,
    });
    assert.equal(stopRequest(good, undefined, true).confirmDuplicate, true);
  });

  it("refuses to build a request for a stop with no valid position", () => {
    assert.throws(() => stopRequest({ ...good, latitude: "" }, undefined, false));
  });
});

describe("INC-080 correcting a stop", () => {
  const target: StopTarget = { name: "Kadawatha", nameSinhala: "කඩවත", description: "Near the bridge", city: "Kadawatha", latitude: 7.001, longitude: 79.95, isAccessible: false };
  const start = () => ({ ...stopFormFrom(target, TODAY), observationMethod: "TOLD_BY_CREW" });

  it("starts as the stop is now, with today as the day", () => {
    const f = stopFormFrom(target, TODAY);
    assert.equal(f.name, "Kadawatha");
    assert.equal(f.latitude, "7.00100");
    assert.equal(f.observedOn, TODAY);
    assert.equal(f.observationMethod, "");
    assert.equal(stopFormFrom({}, TODAY).latitude, "");
  });

  it("marks only what differs, ignoring stray spaces and rounding of the position", () => {
    assert.equal(changedStopFields(target, start()).size, 0);
    assert.deepEqual([...changedStopFields(target, { ...start(), name: "Kadawatha Junction", city: " Kadawatha ", isAccessible: true })].sort(), ["isAccessible", "name"]);
    assert.deepEqual([...changedStopFields(target, { ...start(), latitude: "7.00200" })], ["position"]);
    assert.deepEqual([...changedStopFields(target, { ...start(), latitude: "" })], ["position"]);
    assert.equal(changedStopFields(null, start()).size, 0);
  });

  it("refuses a correction that changes nothing, and accepts one that changes something", () => {
    assert.match(stopProblems(start(), { today: TODAY, target })._form, /haven't changed anything/);
    assert.deepEqual(stopProblems({ ...start(), name: "Kadawatha Junction" }, { today: TODAY, target }), {});
  });

  it("sends the whole stop, aimed at the target", () => {
    const r = stopRequest({ ...start(), name: "Kadawatha Junction" }, "stop-1", false);
    assert.equal(r.targetStopId, "stop-1");
    assert.equal(r.nameSinhala, "කඩවත");
    assert.equal(r.description, "Near the bridge");
  });
});

describe("INC-080 who runs a bus", () => {
  const good = { ...emptyWorkingForm(TODAY), operator: "Ceylon Express", observationMethod: "RODE_THE_ROUTE" };

  it("needs at least an operator, a plate or a service class, and how you know", () => {
    assert.deepEqual(workingProblems(good, TODAY), {});
    assert.deepEqual(workingProblems({ ...emptyWorkingForm(TODAY), plates: "ND-1", observationMethod: "OTHER" }, TODAY), {});
    assert.deepEqual(workingProblems({ ...emptyWorkingForm(TODAY), serviceClass: "LUXURY", observationMethod: "OTHER" }, TODAY), {});
    const p = workingProblems(emptyWorkingForm(TODAY), TODAY);
    assert.match(p._form, /at least an operator, a plate or a service class/);
    assert.equal(p.observationMethod, "Tell us how you know.");
  });

  it("checks the day, the operator, the plates and the note", () => {
    const p = workingProblems({ ...good, observedOn: "2027-01-01", operator: "x".repeat(256), plates: Array.from({ length: 11 }, (_, i) => `P${i}`).join(","), note: "x".repeat(1001) }, TODAY);
    assert.deepEqual(Object.keys(p).sort(), ["note", "observedOn", "operator", "plates"]);
  });

  it("builds the request with the plates as a list and blanks left out", () => {
    assert.deepEqual(workingRequest({ ...good, plates: "ND-1712, ND-1713", serviceClass: "LUXURY", note: " " }, "sch-1"), {
      scheduleId: "sch-1",
      operatorNameObserved: "Ceylon Express",
      platesObserved: ["ND-1712", "ND-1713"],
      serviceClass: "LUXURY",
      observedOn: TODAY,
      observationMethod: "RODE_THE_ROUTE",
      note: undefined,
    });
    const bare = workingRequest({ ...good, operator: "", plates: "ND-1", serviceClass: "" }, "sch-1");
    assert.equal(bare.operatorNameObserved, undefined);
    assert.equal(bare.serviceClass, undefined);
  });
});

describe("INC-080 correcting a working", () => {
  const start = { ...emptyCorrectionForm(TODAY), observationMethod: "TOLD_BY_CREW" };

  it("needs something said: a change, or that it has stopped", () => {
    assert.match(correctionProblems(start, TODAY)._form, /Say what's wrong/);
    assert.deepEqual(correctionProblems({ ...start, operator: "New Bus Co" }, TODAY), {});
    assert.deepEqual(correctionProblems({ ...start, stopped: true }, TODAY), {});
  });

  it("needs a real last day, not in the future, when it has stopped", () => {
    assert.equal(correctionProblems({ ...start, stopped: true, endDate: "2027-01-01" }, TODAY).endDate, "That day hasn't happened yet.");
    assert.equal(correctionProblems({ ...start, stopped: true, endDate: "" }, TODAY).endDate, "Say the day it last ran.");
    assert.equal(correctionProblems({ ...start, operator: "x", stopped: false, endDate: "2027-01-01" }, TODAY).endDate, undefined);
  });

  it("sends the end day only when it has stopped, and leaves blanks blank", () => {
    assert.equal(correctionRequest({ ...start, operator: "New Bus Co", endDate: "2026-09-01" }, "w-1").effectiveEndDate, undefined);
    const r = correctionRequest({ ...start, stopped: true, endDate: "2026-09-01" }, "w-1");
    assert.equal(r.effectiveEndDate, "2026-09-01");
    assert.equal(r.operatorNameObserved, undefined);
    assert.equal(r.platesObserved, undefined);
    assert.equal(r.targetWorkingId, "w-1");
  });
});
