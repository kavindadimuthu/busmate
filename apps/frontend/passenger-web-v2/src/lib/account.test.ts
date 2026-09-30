import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { accountTabs, applyBlockedText, roleOf, roleText, showBecomeContributor, tabFor, type Built, type StandingLike } from "./account.ts";

const NONE: StandingLike = { status: "NONE", activeContributor: false, activeSteward: false, cannotApplyReason: "ACCOUNT_NOT_ACTIVE" };
const APPLIED: StandingLike = { status: "APPLIED", cannotApplyReason: "ALREADY_APPLIED", contributor: { level: "CONTRIBUTOR" } };
const CONTRIBUTOR: StandingLike = { status: "ACTIVE", activeContributor: true, activeSteward: false, cannotApplyReason: "ALREADY_CONTRIBUTOR", contributor: { level: "CONTRIBUTOR" } };
const STEWARD: StandingLike = { status: "ACTIVE", activeContributor: true, activeSteward: true, contributor: { level: "STEWARD", stewardScopeRouteGroupIds: ["g1"] } };
const STALE: StandingLike = { status: "ACTIVE", activeContributor: false, activeSteward: false, contributor: { level: "CONTRIBUTOR" } };
const SUSPENDED: StandingLike = { status: "SUSPENDED", cannotApplyReason: "SUSPENDED", contributor: { decisionReason: "Repeated wrong times" } };
const DECLINED: StandingLike = { status: "DECLINED", contributor: { decisionReason: "  " } };
const STAFF: StandingLike = { status: "NONE", cannotApplyReason: "NOT_A_PASSENGER" };
const ALL: Built = { programme: true, contributions: true, review: true, proposals: true };
const NOTHING: Built = { programme: false, contributions: false, review: false, proposals: false };

describe("INC-077 what a standing means", () => {
  it("reads every standing core-service can give", () => {
    assert.equal(roleOf(NONE), "passenger");
    assert.equal(roleOf(APPLIED), "applicant");
    assert.equal(roleOf(CONTRIBUTOR), "contributor");
    assert.equal(roleOf(STEWARD), "steward");
    assert.equal(roleOf(STALE), "agreement-due");
    assert.equal(roleOf(SUSPENDED), "suspended");
    assert.equal(roleOf(DECLINED), "declined");
    assert.equal(roleOf(STAFF), "other");
  });

  it("says nothing while the standing isn't known, and for accounts that are not passengers", () => {
    assert.equal(roleOf(undefined), null);
    assert.equal(roleOf(null), null);
    assert.equal(roleText("other", STAFF), null);
  });

  it("treats a steward as a steward even though they are also a contributor", () => {
    assert.equal(roleOf({ ...STEWARD, activeContributor: true }), "steward");
  });

  it("words each role, naming a steward's corridors when known", () => {
    assert.equal(roleText("passenger", NONE)?.title, "Passenger");
    assert.equal(roleText("contributor", CONTRIBUTOR)?.title, "Contributor");
    assert.match(roleText("steward", STEWARD, ["Colombo - Kandy"])?.detail ?? "", /Colombo - Kandy/);
    assert.match(roleText("steward", STEWARD, ["A", "B"])?.detail ?? "", /A, B/);
    assert.match(roleText("steward", STEWARD)?.detail ?? "", /review other contributors/);
    assert.match(roleText("agreement-due", STALE)?.detail ?? "", /agreement has changed/);
  });

  it("shows the reason a suspension or refusal was given, and a kind default only for a refusal", () => {
    assert.equal(roleText("suspended", SUSPENDED)?.detail, "Repeated wrong times");
    assert.equal(roleText("suspended", { status: "SUSPENDED" })?.detail, null);
    assert.equal(roleText("declined", DECLINED)?.detail, "You can apply again.");
  });
});

describe("INC-077 which tabs appear", () => {
  const ids = (role: ReturnType<typeof roleOf>, s: StandingLike | undefined, b: Built) => accountTabs(role, s, b).map((t) => t.id);

  it("gives everyone Profile and Tickets, and nothing else while the contribute screens aren't built", () => {
    for (const s of [NONE, APPLIED, CONTRIBUTOR, STEWARD, STALE, SUSPENDED, DECLINED, STAFF, undefined]) assert.deepEqual(ids(roleOf(s), s, NOTHING), ["profile", "tickets"]);
  });

  it("adds Contributions for anyone with a contributor standing, once it is built", () => {
    for (const s of [APPLIED, CONTRIBUTOR, STALE, SUSPENDED, DECLINED]) assert.deepEqual(ids(roleOf(s), s, ALL), ["profile", "tickets", "contributions"], String(s.status));
  });

  it("adds Review only for an active steward, once it is built", () => {
    assert.deepEqual(ids(roleOf(STEWARD), STEWARD, ALL), ["profile", "tickets", "contributions", "review"]);
    assert.deepEqual(ids(roleOf(STEWARD), STEWARD, { ...ALL, review: false }), ["profile", "tickets", "contributions"]);
    assert.deepEqual(ids(roleOf(CONTRIBUTOR), CONTRIBUTOR, ALL), ["profile", "tickets", "contributions"]);
  });

  it("gives an ordinary passenger, an unknown standing and staff no contributor tabs", () => {
    for (const s of [NONE, STAFF, undefined]) assert.deepEqual(ids(roleOf(s), s, ALL), ["profile", "tickets"]);
  });

  it("points each tab at the address the app already serves", () => {
    assert.deepEqual(accountTabs("steward", STEWARD, ALL).map((t) => t.to), ["/profile", "/tickets", "/contribute/mine", "/contribute/review"]);
  });
});

describe("INC-077 becoming a contributor", () => {
  it("is offered only to a passenger who could apply, and only once the programme page exists", () => {
    const can: StandingLike = { status: "NONE", canApply: true };
    assert.equal(showBecomeContributor("passenger", can, ALL), true);
    assert.equal(showBecomeContributor("passenger", can, NOTHING), false);
    assert.equal(showBecomeContributor("passenger", NONE, ALL), false);
    assert.equal(showBecomeContributor("contributor", CONTRIBUTOR, ALL), false);
    assert.equal(showBecomeContributor(null, undefined, ALL), false);
  });

  it("explains a blocker the passenger can do something about, and only that", () => {
    assert.match(applyBlockedText({ cannotApplyReason: "EMAIL_NOT_VERIFIED" }) ?? "", /verified/);
    assert.match(applyBlockedText(NONE) ?? "", /verified/);
    assert.equal(applyBlockedText(STAFF), null);
    assert.equal(applyBlockedText(CONTRIBUTOR), null);
    assert.equal(applyBlockedText(undefined), null);
  });
});

describe("INC-077 which tab is current", () => {
  it("marks a list page and its deeper pages with the same tab", () => {
    assert.equal(tabFor("/profile"), "profile");
    assert.equal(tabFor("/tickets"), "tickets");
    assert.equal(tabFor("/tickets/24"), "tickets");
    assert.equal(tabFor("/contribute/mine"), "contributions");
    assert.equal(tabFor("/contribute/mine/abc"), "contributions");
    assert.equal(tabFor("/contribute/review/abc"), "review");
    assert.equal(tabFor("/contribute"), null);
    assert.equal(tabFor("/routes"), null);
  });
});
