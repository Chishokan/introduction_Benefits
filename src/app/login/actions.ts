"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, getSession, homeFor, startSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkAccountingPassword, verifyPassword } from "@/lib/session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const who = String(formData.get("who") ?? "");
  const password = String(formData.get("password") ?? "");

  if (who === "accounting") {
    if (!checkAccountingPassword(password)) return { error: "パスワードが違います" };
    await startSession({ role: "accounting" });
    redirect("/admin");
  }

  const campusId = Number(who);
  const campus = campusId ? await prisma.campus.findUnique({ where: { id: campusId } }) : null;
  if (!campus || !campus.active || !verifyPassword(password, campus.passwordHash)) {
    return { error: "校舎またはパスワードが違います" };
  }
  await startSession({ role: "campus", campusId: campus.id });
  redirect("/campus");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}

// 申込みエラーを対応済みにする（経理は全校舎、校舎担当者は自校舎のみ）
export async function setApplyErrorResolved(id: number, resolved: boolean): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const target = await prisma.applyError.findUnique({ where: { id } });
  if (!target) return;
  if (session.role === "campus" && target.campusId !== session.campusId) redirect(homeFor(session));
  await prisma.applyError.update({ where: { id }, data: { resolvedAt: resolved ? new Date() : null } });
  revalidatePath("/", "layout");
}
