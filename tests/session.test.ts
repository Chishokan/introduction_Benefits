import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_TTL_MS,
  checkAccountingPassword,
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "@/lib/session";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-0123456789";
  process.env.ADMIN_PASSWORD = "pass-word";
});

describe("session", () => {
  it("役割と校舎を含むトークンを検証できる", () => {
    const now = 1_700_000_000_000;
    expect(verifySessionToken(createSessionToken({ role: "accounting" }, now), now + 1000)).toEqual({
      role: "accounting",
    });
    const campus = createSessionToken({ role: "campus", campusId: 3 }, now);
    expect(verifySessionToken(campus, now + 1000)).toEqual({ role: "campus", campusId: 3 });
    expect(verifySessionToken(campus, now + SESSION_TTL_MS + 1)).toBeNull();
  });
  it("改ざん・不正な値を拒否する", () => {
    const [, sig] = createSessionToken({ role: "campus", campusId: 1 }).split(".");
    const forged = Buffer.from(JSON.stringify({ role: "accounting", exp: Date.now() + 1e6 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });
  it("経理パスワードを照合する", () => {
    expect(checkAccountingPassword("pass-word")).toBe(true);
    expect(checkAccountingPassword("pass-wor")).toBe(false);
    delete process.env.ADMIN_PASSWORD;
    expect(checkAccountingPassword("")).toBe(false);
  });
  it("校舎パスワードはハッシュで照合する", () => {
    const stored = hashPassword("hino-2026");
    expect(stored).not.toContain("hino-2026");
    expect(verifyPassword("hino-2026", stored)).toBe(true);
    expect(verifyPassword("hino-2027", stored)).toBe(false);
    expect(verifyPassword("hino-2026", null)).toBe(false);
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });
});
