import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { changedFields, hasChanges, initialsOf, passwordSchema, phoneDigits, profileSchema } from "./profile.ts";

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => schema.safeParse(v).success;
const message = (schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string; path: (string | number)[] }[] } } }, v: unknown) => schema.safeParse(v).error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`) ?? [];

describe("INC-075 initials", () => {
  it("takes the first letters of the first two words", () => {
    assert.equal(initialsOf("Nimal Perera"), "NP");
    assert.equal(initialsOf("nimal"), "N");
    assert.equal(initialsOf("  Kumari   de   Silva "), "KD");
    assert.equal(initialsOf("කමල් පෙරේරා"), "කප");
    assert.equal(initialsOf(""), "?");
    assert.equal(initialsOf(undefined), "?");
  });
});

describe("INC-075 the details form", () => {
  const empty = profileSchema({});
  const hasUsername = profileSchema({ username: "nimal" });

  it("needs a name of at least two characters", () => {
    assert.equal(ok(empty, { fullName: "N", username: "", phoneNumber: "" }), false);
    assert.equal(ok(empty, { fullName: "  ", username: "", phoneNumber: "" }), false);
    assert.equal(ok(empty, { fullName: "Ni", username: "", phoneNumber: "" }), true);
  });

  it("lets username and phone stay empty for someone who has none", () => {
    assert.equal(ok(empty, { fullName: "Nimal", username: "", phoneNumber: "" }), true);
  });

  it("holds a username to 3-30 letters, numbers and underscores", () => {
    for (const bad of ["ab", "has space", "dash-ed", "a".repeat(31), "emoji😀"]) assert.equal(ok(empty, { fullName: "Nimal", username: bad, phoneNumber: "" }), false, bad);
    for (const good of ["abc", "Nimal_99", "a".repeat(30)]) assert.equal(ok(empty, { fullName: "Nimal", username: good, phoneNumber: "" }), true, good);
  });

  it("won't let an existing username be blanked, since the server can't clear one", () => {
    assert.deepEqual(message(hasUsername, { fullName: "Nimal", username: "", phoneNumber: "" }), ["username: A username can be changed but not removed"]);
    assert.equal(ok(hasUsername, { fullName: "Nimal", username: "nimal2", phoneNumber: "" }), true);
  });

  it("accepts ordinary Sri Lankan phone numbers and rejects nonsense", () => {
    for (const good of ["0771234567", "+94 77 123 4567", "077-123-4567", "(011) 234 5678", "1234567"]) assert.equal(ok(empty, { fullName: "Nimal", username: "", phoneNumber: good }), true, good);
    for (const bad of ["12345", "abc1234567", "+", "077 123 45x7", "1".repeat(16), "--0771234567"]) assert.equal(ok(empty, { fullName: "Nimal", username: "", phoneNumber: bad }), false, bad);
    assert.equal(phoneDigits("+94 (77) 123-4567"), 11);
  });
});

describe("INC-075 what changed", () => {
  const current = { fullName: "Nimal Perera", username: "nimal", phoneNumber: "0771234567" };

  it("sends nothing when nothing changed, ignoring stray spaces", () => {
    const c = changedFields(current, { fullName: " Nimal Perera ", username: "nimal ", phoneNumber: "0771234567" });
    assert.deepEqual(c, {});
    assert.equal(hasChanges(c), false);
  });

  it("sends only the fields that changed, trimmed", () => {
    assert.deepEqual(changedFields(current, { fullName: "Nimal P", username: "nimal", phoneNumber: "0771234567" }), { fullName: "Nimal P" });
    assert.deepEqual(changedFields(current, { fullName: "Nimal Perera", username: "nimal_p", phoneNumber: " 0712345678" }), { username: "nimal_p", phoneNumber: "0712345678" });
  });

  it("never sends a blank username, but does send a blank phone number to clear it", () => {
    const c = changedFields(current, { fullName: "Nimal Perera", username: "", phoneNumber: "" });
    assert.equal("username" in c, false);
    assert.deepEqual(c, { phoneNumber: "" });
    assert.equal(hasChanges(c), true);
  });

  it("treats a person with no username or phone yet as changing when they add one", () => {
    assert.deepEqual(changedFields({ fullName: "Nimal" }, { fullName: "Nimal", username: "nimal", phoneNumber: "0771234567" }), { username: "nimal", phoneNumber: "0771234567" });
    assert.deepEqual(changedFields({ fullName: "Nimal" }, { fullName: "Nimal", username: "", phoneNumber: "" }), {});
  });
});

describe("INC-075 the password form", () => {
  it("needs the current password and a new one of at least 8 characters", () => {
    assert.equal(ok(passwordSchema, { currentPassword: "", newPassword: "longenough" }), false);
    assert.equal(ok(passwordSchema, { currentPassword: "old", newPassword: "short" }), false);
    assert.equal(ok(passwordSchema, { currentPassword: "oldpassword", newPassword: "longenough" }), true);
  });

  it("refuses a new password that is the same as the current one", () => {
    assert.deepEqual(message(passwordSchema, { currentPassword: "samesame1", newPassword: "samesame1" }), ["newPassword: Choose a password you haven't used here"]);
  });
});
