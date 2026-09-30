import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applicationPayload,
  applicationSchema,
  applyGate,
  countByStatus,
  EMPTY_APPLICATION,
  filterProposals,
  formatDay,
  locationText,
  mapsLink,
  observationLabel,
  proposalKind,
  proposalTitle,
  statusLabel,
  statusTone,
  stopRows,
  workingRows,
  type ApplicationValues,
  type ChangesetLike,
} from "./contributions.ts";

const ok = (v: unknown) => applicationSchema.safeParse(v).success;
const problems = (v: unknown) => applicationSchema.safeParse(v).error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`) ?? [];
const valid: ApplicationValues = { ...EMPTY_APPLICATION, motivation: "I ride the Colombo to Kandy bus every week", agreementAccepted: true };

describe("INC-079 how a proposal reads", () => {
  it("words every status and shows an unknown one as it is", () => {
    assert.equal(statusLabel("PENDING"), "Under review");
    assert.equal(statusLabel("REJECTED"), "Not approved");
    assert.equal(statusLabel("SOMETHING"), "SOMETHING");
    assert.equal(statusLabel(undefined), "Unknown");
    assert.equal(statusTone("APPROVED"), "good");
    assert.equal(statusTone("PENDING"), "warn");
    assert.equal(statusTone("REJECTED"), "bad");
    assert.equal(statusTone("WITHDRAWN"), "quiet");
  });

  it("titles and kinds a stop and a working differently", () => {
    assert.equal(proposalTitle("STOP", { name: "Kadawatha Junction" }), "Kadawatha Junction");
    assert.equal(proposalTitle("STOP", {}), "Untitled proposal");
    assert.equal(proposalTitle("SCHEDULE_WORKING", { operatorNameObserved: "Ceylon Express", platesObserved: ["NB-1"] }), "Ceylon Express");
    assert.equal(proposalTitle("SCHEDULE_WORKING", { platesObserved: ["NB-1", "NB-2"] }), "NB-1, NB-2");
    assert.equal(proposalTitle("SCHEDULE_WORKING", {}), "Who runs a departure");
    assert.equal(proposalKind("STOP", "CREATE"), "New stop");
    assert.equal(proposalKind("STOP", "UPDATE"), "Correction to a stop");
    assert.equal(proposalKind("SCHEDULE_WORKING", "CREATE"), "Who usually runs a departure");
    assert.equal(proposalKind("SCHEDULE_WORKING", "UPDATE"), "Correction to a working");
  });

  it("words how the contributor knows, differently for a bus than for a stop", () => {
    assert.equal(observationLabel("STOP", "RODE_THE_ROUTE"), "Rode the route past this stop");
    assert.equal(observationLabel("SCHEDULE_WORKING", "RODE_THE_ROUTE"), "Rode this bus");
    assert.equal(observationLabel("SCHEDULE_WORKING", "TOLD_BY_CREW"), "A conductor or driver said so");
    assert.equal(observationLabel("STOP", "NEW_KIND"), "NEW_KIND");
    assert.equal(observationLabel("STOP", undefined), "");
  });

  it("counts and filters by status", () => {
    const list: ChangesetLike[] = [{ id: "1", status: "PENDING" }, { id: "2", status: "APPROVED" }, { id: "3", status: "PENDING" }];
    assert.deepEqual(countByStatus(list), { PENDING: 2, APPROVED: 1 });
    assert.deepEqual(filterProposals(list, "PENDING").map((p) => p.id), ["1", "3"]);
    assert.equal(filterProposals(list, "ALL").length, 3);
    assert.deepEqual(filterProposals(list, "REVERTED"), []);
  });
});

describe("INC-079 what a proposal says", () => {
  it("writes a position from whatever is known", () => {
    assert.equal(locationText({ location: { city: "Kandy", latitude: 7.29, longitude: 80.63 } }), "Kandy · 7.29000, 80.63000");
    assert.equal(locationText({ location: { latitude: 7.29, longitude: 80.63 } }), "7.29000, 80.63000");
    assert.equal(locationText({ location: { city: "Kandy" } }), "Kandy");
    assert.equal(locationText({ location: {} }), null);
    assert.equal(locationText({}), null);
    assert.equal(locationText(null), null);
  });

  it("links a position to Google Maps only when it has coordinates", () => {
    assert.equal(mapsLink({ location: { latitude: 7.29, longitude: 80.63 } }), "https://www.google.com/maps?q=7.29,80.63");
    assert.equal(mapsLink({ location: { city: "Kandy" } }), null);
    assert.equal(mapsLink(undefined), null);
  });

  it("lists a new stop's name and position", () => {
    const rows = stopRows({ action: "CREATE", proposedValues: { name: "Kadawatha", nameSinhala: "කඩවත", location: { latitude: 7.0, longitude: 79.9 } } });
    assert.deepEqual(rows.map((r) => r.label), ["Name", "Name (Sinhala)", "Position"]);
    assert.equal(rows[0].after, "Kadawatha");
    assert.ok(rows.every((r) => r.before === null));
  });

  it("lists only what a correction changes, with the old value", () => {
    const rows = stopRows({
      action: "UPDATE",
      targetSnapshot: { name: "Kadawatha", description: "Old", location: { latitude: 7.0, longitude: 79.9 } },
      proposedValues: { name: "Kadawatha Junction", description: "Old", location: { latitude: 7.0001, longitude: 79.9 } },
    });
    assert.deepEqual(rows.map((r) => `${r.label}: ${r.before} → ${r.after}`), ["Name: Kadawatha → Kadawatha Junction", "Position: 7.00000, 79.90000 → 7.00010, 79.90000"]);
    assert.ok(rows.every((r) => r.changed));
  });

  it("writes a new working, and a correction against what was recorded", () => {
    assert.deepEqual(
      workingRows({ action: "CREATE", proposedValues: { operatorNameObserved: "Ceylon Express", platesObserved: ["NB-1", "NB-2"], serviceClass: "LUXURY" } }).map((r) => `${r.label}: ${r.after}`),
      ["Operator: Ceylon Express", "Plates (alternating): NB-1 or NB-2", "Service class: Luxury"],
    );
    const rows = workingRows({
      action: "UPDATE",
      targetSnapshot: { operatorNameObserved: "Old Bus Co", vehicles: [{ plateObserved: "NB-1" }], serviceClass: "NORMAL" },
      proposedValues: { operatorNameObserved: "New Bus Co", platesObserved: ["NB-1"], serviceClass: "NORMAL", effectiveEndDate: "2026-09-01" },
    });
    assert.deepEqual(rows.map((r) => [r.label, r.changed]), [["Operator", true], ["Plate", false], ["Service class", false], ["Says it stopped", true]]);
    assert.equal(rows[0].before, "Old Bus Co");
  });

  it("writes days in Sri Lanka time, for timestamps and plain dates, and nothing for junk", () => {
    assert.equal(formatDay("2026-10-05"), "5 Oct 2026");
    assert.equal(formatDay("2026-09-30T20:00:00Z"), "1 Oct 2026");
    assert.equal(formatDay("2026-09-30"), "30 Sep 2026");
    assert.equal(formatDay("2026-12-01"), "1 Dec 2026");
    assert.equal(formatDay(undefined), "");
    assert.equal(formatDay("not a date"), "");
  });
});

describe("INC-079 opening the application page", () => {
  it("sends someone already involved to their Contributions tab", () => {
    for (const status of ["APPLIED", "ACTIVE", "SUSPENDED"]) assert.deepEqual(applyGate({ status, canApply: false }), { kind: "contributions" });
  });

  it("shows the form to anyone who can apply, including someone turned down before", () => {
    assert.deepEqual(applyGate({ status: "NONE", canApply: true }), { kind: "form" });
    assert.deepEqual(applyGate({ status: "DECLINED", canApply: true }), { kind: "form" });
  });

  it("says why someone can't, in words, and never shows the form to them", () => {
    assert.match((applyGate({ status: "NONE", canApply: false, cannotApplyReason: "NOT_A_PASSENGER" }) as { text: string }).text, /passenger accounts/);
    assert.match((applyGate({ status: "NONE", canApply: false, cannotApplyReason: "EMAIL_NOT_VERIFIED" }) as { text: string }).text, /verified/);
    assert.equal(applyGate({ status: "NONE", canApply: false, cannotApplyReason: "SOMETHING_NEW" }).kind, "blocked");
    assert.deepEqual(applyGate(undefined), { kind: "loading" });
  });
});

describe("INC-079 the application form", () => {
  it("needs a motivation of at least 20 characters and the agreement accepted", () => {
    assert.equal(ok(valid), true);
    assert.deepEqual(problems({ ...valid, motivation: "too short" }), ["motivation: Say a bit more: at least 20 characters"]);
    assert.deepEqual(problems({ ...valid, agreementAccepted: false }), ["agreementAccepted: You need to accept the agreement to apply"]);
    assert.equal(ok({ ...valid, motivation: "x".repeat(1001) }), false);
  });

  it("needs the operator and the link when there is a link, and not when there isn't", () => {
    assert.equal(ok({ ...valid, affiliation: "NONE", affiliationDetail: "" }), true);
    assert.deepEqual(problems({ ...valid, affiliation: "OPERATOR_EMPLOYEE", affiliationDetail: "   " }), ["affiliationDetail: Tell us which operator, and how you're linked to them"]);
    assert.equal(ok({ ...valid, affiliation: "BUS_OWNER", affiliationDetail: "I own two buses on the 138" }), true);
  });

  it("caps the corridors and rejects an unknown affiliation", () => {
    assert.equal(ok({ ...valid, corridorRouteGroupIds: Array.from({ length: 21 }, (_, i) => String(i)) }), false);
    assert.equal(ok({ ...valid, affiliation: "SOMETHING" }), false);
  });

  it("sends a tidy payload: no blank district, and operator detail only with a link", () => {
    const none = applicationPayload({ ...valid, motivation: "  I ride it daily and know the stops well  ", homeDistrict: "  " }, "draft-1");
    assert.equal(none.motivation, "I ride it daily and know the stops well");
    assert.equal(none.homeDistrict, undefined);
    assert.equal(none.affiliationDetail, undefined);
    assert.equal(none.agreementVersion, "draft-1");
    const linked = applicationPayload({ ...valid, homeDistrict: " Colombo ", affiliation: "OTHER", affiliationDetail: " Cousin drives for CTB " }, "draft-1");
    assert.equal(linked.homeDistrict, "Colombo");
    assert.equal(linked.affiliationDetail, "Cousin drives for CTB");
  });
});
