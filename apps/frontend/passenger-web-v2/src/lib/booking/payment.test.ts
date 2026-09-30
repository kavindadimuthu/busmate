import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SETTLE_MAX_POLLS, formatMoney, isHttpUrl, paymentMode, settlement, ticketIdFromOrderId } from "./payment.ts";

describe("INC-070 how a booking is paid", () => {
  it("is hosted only when the server gave both a checkout form and an address", () => {
    assert.equal(paymentMode({ redirectUrl: "https://sandbox.payhere.lk/pay/checkout", checkoutFields: { hash: "x" } }), "hosted");
    assert.equal(paymentMode({}), "dummy");
    assert.equal(paymentMode({ redirectUrl: "https://x.example/pay" }), "dummy");
    assert.equal(paymentMode({ checkoutFields: { hash: "x" } }), "dummy");
    assert.equal(paymentMode({ redirectUrl: "https://x.example/pay", checkoutFields: {} }), "dummy");
  });

  it("only ever sends the browser to an http(s) address", () => {
    assert.equal(isHttpUrl("https://sandbox.payhere.lk/pay"), true);
    assert.equal(isHttpUrl("javascript:alert(1)"), false);
    assert.equal(isHttpUrl("//evil.example"), false);
    assert.equal(isHttpUrl("not a url"), false);
    assert.equal(isHttpUrl(null), false);
    assert.equal(paymentMode({ redirectUrl: "javascript:alert(1)", checkoutFields: { a: "b" } }), "dummy");
  });
});

describe("INC-070 amounts and order ids", () => {
  it("writes money the same way everywhere", () => {
    assert.equal(formatMoney(180), "Rs. 180.00");
    assert.equal(formatMoney(1250.5), "Rs. 1,250.50");
    assert.equal(formatMoney(0), "Rs. 0.00");
    assert.equal(formatMoney(Number.NaN), "Rs. 0.00");
  });

  it("reads the ticket out of PayHere's order id and nothing else", () => {
    assert.equal(ticketIdFromOrderId("TICKET-24"), 24);
    assert.equal(ticketIdFromOrderId("TICKET-0"), null);
    assert.equal(ticketIdFromOrderId("TICKET-"), null);
    assert.equal(ticketIdFromOrderId("ORDER-24"), null);
    assert.equal(ticketIdFromOrderId("TICKET-24x"), null);
    assert.equal(ticketIdFromOrderId("TICKET-99999999999999999999"), null);
    assert.equal(ticketIdFromOrderId(null), null);
  });
});

describe("INC-070 waiting for a payment to settle", () => {
  it("is paid on SUCCESS and failed on FAILED, whatever the case", () => {
    assert.equal(settlement("SUCCESS", 1, false), "paid");
    assert.equal(settlement("success", 1, false), "paid");
    assert.equal(settlement("FAILED", 1, false), "failed");
  });

  it("keeps waiting on anything else, then gives up as slow, not as failed", () => {
    assert.equal(settlement("PENDING", 1, false), "waiting");
    assert.equal(settlement(undefined, 0, false), "waiting");
    assert.equal(settlement("PENDING", SETTLE_MAX_POLLS, false), "slow");
  });

  it("is failed when the check itself was refused", () => {
    assert.equal(settlement(undefined, 3, true), "failed");
  });

  it("a payment that succeeds on the last check is paid, not slow", () => {
    assert.equal(settlement("SUCCESS", SETTLE_MAX_POLLS, false), "paid");
  });
});
