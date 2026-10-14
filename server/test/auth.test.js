import { after, afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  clearDatabase,
  login,
  registerUser,
  startDatabase,
  stopDatabase,
} from "./setup.js";

before(startDatabase);
afterEach(clearDatabase);
after(stopDatabase);

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token without the password", async () => {
    const { res, body } = await registerUser({ email: "New@Example.com" });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, "new@example.com");
    assert.equal(res.body.user.name, body.name);
    assert.equal(res.body.user.password, undefined);
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser({ email: "dup@example.com" });
    const { res } = await registerUser({ email: "dup@example.com" });

    assert.equal(res.status, 409);
  });

  it("rejects missing fields, a bad email and a short password with 400", async () => {
    const cases = [
      { name: "" },
      { email: "not-an-email" },
      { password: "12345" },
    ];
    for (const overrides of cases) {
      const { res } = await registerUser(overrides);
      assert.equal(res.status, 400, JSON.stringify(overrides));
    }
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for the right password", async () => {
    const { body } = await registerUser();
    const res = await login(body.email, body.password);

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, body.email);
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    const { body } = await registerUser();
    const wrongPassword = await login(body.email, "wrong-password");
    const unknownEmail = await login("nobody@example.com", body.password);

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, "Invalid email or password");
    assert.equal(unknownEmail.body.message, wrongPassword.body.message);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user for a valid token", async () => {
    const { body, token } = await registerUser();
    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.email, body.email);
  });

  it("returns 401 without a token or with a bad one", async () => {
    const noToken = await api().get("/api/auth/me");
    const badToken = await api()
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-jwt");

    assert.equal(noToken.status, 401);
    assert.equal(badToken.status, 401);
  });
});
