import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forgotSchema, resetSchema, tokenFrom } from "./passwordReset.ts";

describe("reset password rules", () => {
  it("accepts a long enough password", () => assert.ok(resetSchema.safeParse({ password: "abcd1234" }).success));
  it("refuses a short one, in words", () => {
    const r = resetSchema.safeParse({ password: "abc" });
    assert.equal(r.success, false);
    if (!r.success) assert.match(r.error.issues[0].message, /at least 8/);
  });
});

describe("forgot password", () => {
  it("needs an email", () => {
    assert.equal(forgotSchema.safeParse({ email: "" }).success, false);
    assert.equal(forgotSchema.safeParse({ email: "not-an-email" }).success, false);
    assert.ok(forgotSchema.safeParse({ email: " a@b.co " }).success);
  });
});

describe("reading the link", () => {
  it("finds the token, encoded or not", () => {
    assert.equal(tokenFrom("?token=abc123"), "abc123");
    assert.equal(tokenFrom("?token=a%2Bb%3D"), "a+b=");
  });
  it("is null when missing or blank", () => {
    assert.equal(tokenFrom(""), null);
    assert.equal(tokenFrom("?token="), null);
    assert.equal(tokenFrom("?token=%20"), null);
    assert.equal(tokenFrom("?other=1"), null);
  });
});
