import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// 職員用セッション。`<payload(base64url JSON)>.<署名>` を HttpOnly Cookie に保存する。
// role: accounting = 経理（全校舎・全操作）、campus = 校舎担当者（自校舎の状況確認と STEP3/4 入力）

export const SESSION_COOKIE = "rb_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type Session = { role: "accounting" } | { role: "campus"; campusId: number };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET を16文字以上で設定してください");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // 長さの違いで早期 return しないようハッシュ同士を比較する
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createSessionToken(session: Session, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: now + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp <= now) return null;
    if (data.role === "accounting") return { role: "accounting" };
    if (data.role === "campus" && Number.isInteger(data.campusId)) return { role: "campus", campusId: data.campusId };
    return null;
  } catch {
    return null;
  }
}

// 経理用パスワード（環境変数 ADMIN_PASSWORD）
export function checkAccountingPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

// 校舎パスワードは DB に scrypt ハッシュで保存する（`salt:hash`）
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  return `${salt}:${scryptSync(password, salt, 32).toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
