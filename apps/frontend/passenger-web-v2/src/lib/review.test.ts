import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { affiliationText, decisionOf, distanceText, rejectProblems, rejectReasons, rejectRequest, trackText, waitingText } from "./review.ts";

describe("reject reasons", () => {
  it("offers a bus only the reasons the server accepts, worded for a bus", () => {
    const r = rejectReasons("SCHEDULE_WORKING");
    assert.deepEqual(r.map((x) => x.value), ["DUPLICATE", "CANNOT_VERIFY", "OTHER"]);
    assert.equal(r[0].label, "Already recorded for this departure");
  });
  it("offers a stop all five", () => assert.equal(rejectReasons("STOP").length, 5));
  it("needs a reason that fits the kind", () => {
    assert.ok(rejectProblems({ reason: "", note: "" }, "STOP").reason);
    assert.ok(rejectProblems({ reason: "NOT_A_STOP", note: "" }, "SCHEDULE_WORKING").reason);
    assert.deepEqual(rejectProblems({ reason: "WRONG_POSITION", note: "" }, "STOP"), {});
  });
  it("needs a note for Other, and keeps it short", () => {
    assert.ok(rejectProblems({ reason: "OTHER", note: "  " }, "STOP").note);
    assert.ok(rejectProblems({ reason: "DUPLICATE", note: "x".repeat(401) }, "STOP").note);
    assert.deepEqual(rejectProblems({ reason: "OTHER", note: "Closed" }, "STOP"), {});
  });
  it("leaves an empty note out of the request", () => {
    assert.deepEqual(rejectRequest({ reason: "DUPLICATE", note: "  " }), { reason: "DUPLICATE" });
    assert.deepEqual(rejectRequest({ reason: "OTHER", note: " Closed " }), { reason: "OTHER", note: "Closed" });
  });
});

describe("what may be decided", () => {
  const pending = { changeset: { status: "PENDING", entityType: "STOP" } };
  it("opens both for a fresh pending proposal", () => assert.deepEqual(decisionOf(pending), { canApprove: true, canReject: true, approveBlockedText: null }));
  it("closes both once decided", () => {
    const d = decisionOf({ changeset: { status: "APPROVED" } });
    assert.equal(d.canApprove || d.canReject, false);
    assert.equal(d.approveBlockedText, null);
  });
  it("closes approve but not reject when out of date, and says so", () => {
    const d = decisionOf({ ...pending, stale: true });
    assert.equal(d.canApprove, false);
    assert.equal(d.canReject, true);
    assert.match(d.approveBlockedText ?? "", /changed since/);
  });
  it("closes approve when a more trusted source holds the stop", () => {
    const d = decisionOf({ ...pending, targetOutranksCommunityTier: true });
    assert.equal(d.canApprove, false);
    assert.match(d.approveBlockedText ?? "", /more trusted/);
  });
  it("closes everything when there is nothing", () => assert.equal(decisionOf(undefined).canReject, false));
});

describe("reading a proposal", () => {
  it("words a distance", () => {
    assert.equal(distanceText(16.4), "about 16 m");
    assert.equal(distanceText(0.2), "less than a metre");
    assert.equal(distanceText(1340), "about 1.3 km");
    assert.equal(distanceText(undefined), null);
    assert.equal(distanceText(-3), null);
  });
  it("words a record, and treats no history as new", () => {
    assert.equal(trackText({ approved: 0, rejected: 0, reverted: 0 }), "No decided proposals yet");
    assert.equal(trackText(undefined), "No decided proposals yet");
    assert.equal(trackText({ approved: 4, rejected: 1, reverted: 0 }), "4 approved · 1 not approved");
    assert.equal(trackText({ approved: 4, rejected: 1, reverted: 2 }), "4 approved · 1 not approved · 2 undone later");
  });
  it("names a link to buses only when there is one", () => {
    assert.equal(affiliationText("NONE"), null);
    assert.equal(affiliationText(undefined), null);
    assert.equal(affiliationText("BUS_OWNER"), "Owns a bus");
  });
  it("counts waiting days in Sri Lanka time", () => {
    const now = new Date("2026-10-05T20:00:00Z"); // 6 Oct 01:30 in Sri Lanka
    assert.equal(waitingText("2026-10-05T19:00:00Z", now), "today");
    assert.equal(waitingText("2026-10-05T10:00:00Z", now), "yesterday");
    assert.equal(waitingText("2026-10-01T10:00:00Z", now), "5 days ago");
    assert.equal(waitingText(undefined, now), "");
    assert.equal(waitingText("nope", now), "");
  });
});
