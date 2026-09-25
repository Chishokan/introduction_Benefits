import { beforeEach, describe, expect, it } from "vitest";
import { SESSION_TTL_MS, checkPassword, createSessionToken, verifySessionToken } from "@/lib/session";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-0123456789";
  process.env.ADMIN_PASSWORD = "pass-word";
});

describe("session", () => {
  it("署名済みトークンを検証できる", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(now);
    expect(verifySessionToken(token, now + 1000)).toBe(true);
    expect(verifySessionToken(token, now + SESSION_TTL_MS + 1)).toBe(false);
  });
  it("改ざん・不正な値を拒否する", () => {
    const token = createSessionToken();
    const [exp, sig] = token.split(".");
    expect(verifySessionToken(`${Number(exp) + 1}.${sig}`)).toBe(false);
    expect(verifySessionToken("garbage")).toBe(false);
    expect(verifySessionToken(undefined)).toBe(false);
  });
  it("パスワードを照合する", () => {
    expect(checkPassword("pass-word")).toBe(true);
    expect(checkPassword("pass-wor")).toBe(false);
    delete process.env.ADMIN_PASSWORD;
    expect(checkPassword("")).toBe(false);
  });
});
