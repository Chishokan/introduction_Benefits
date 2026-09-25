import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken, verifySessionToken, type Session } from "./session";

export type { Session };

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function homeFor(session: Session): string {
  return session.role === "accounting" ? "/admin" : "/campus";
}

// 経理専用のページ・Server Action の先頭で必ず呼ぶ
export async function requireAccounting(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "accounting") redirect(homeFor(session));
}

// 校舎担当者のページ・Server Action の先頭で必ず呼ぶ。ログイン中の校舎 ID を返す
export async function requireCampus(): Promise<number> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "campus") redirect(homeFor(session));
  return session.campusId;
}

export async function startSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
