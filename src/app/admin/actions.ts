"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { ENROLLMENT_TYPES } from "@/lib/constants";
import { parseDateInput } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizeCode } from "@/lib/normalize";
import { checkPassword } from "@/lib/session";

export type ActionState = { ok?: boolean; message?: string; error?: string };

const MAX_RANGE = 500;

function text(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v === "" ? null : v;
}

function date(formData: FormData, name: string): Date | null {
  return parseDateInput(text(formData, name));
}

function enrollmentType(formData: FormData): string | null {
  const v = text(formData, "enrollmentType");
  return v && (ENROLLMENT_TYPES as readonly string[]).includes(v) ? v : null;
}

// ---- ログイン -------------------------------------------------------------

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "パスワードが違います" };
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

// ---- 特典コード ------------------------------------------------------------

const codeField = z
  .string()
  .transform(normalizeCode)
  .refine((v) => /^\d{4,10}$/.test(v), "コードは4〜10桁の数字で入力してください");

export async function createReferrals(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const campusId = Number(formData.get("campusId"));
  if (!campusId || !(await prisma.campus.findUnique({ where: { id: campusId } }))) {
    return { error: "校舎を選択してください" };
  }
  const from = codeField.safeParse(String(formData.get("codeFrom") ?? ""));
  if (!from.success) return { error: from.error.issues[0].message };
  const toRaw = text(formData, "codeTo");
  const to = toRaw ? codeField.safeParse(toRaw) : null;
  if (to && !to.success) return { error: to.error.issues[0].message };

  const start = Number(from.data);
  const end = to?.success ? Number(to.data) : start;
  if (end < start) return { error: "終了コードは開始コード以上にしてください" };
  if (end - start + 1 > MAX_RANGE) return { error: `一度に登録できるのは${MAX_RANGE}件までです` };

  const width = from.data.length;
  const codes = Array.from({ length: end - start + 1 }, (_, i) => String(start + i).padStart(width, "0"));
  const existing = new Set(
    (await prisma.referral.findMany({ where: { code: { in: codes } }, select: { code: true } })).map((r) => r.code),
  );
  const fresh = codes.filter((c) => !existing.has(c));
  if (fresh.length === 0) return { error: "指定したコードはすべて登録済みです" };

  const common = {
    campusId,
    enrollmentType: enrollmentType(formData),
    studentName: text(formData, "studentName"),
    referredName: text(formData, "referredName"),
    staffName: text(formData, "staffName"),
    distributedAt: date(formData, "distributedAt"),
    note: text(formData, "note"),
  };
  revalidatePath("/admin");
  if (codes.length === 1) {
    const created = await prisma.referral.create({ data: { code: fresh[0], ...common } });
    redirect(`/admin/referrals/${created.id}`);
  }
  await prisma.referral.createMany({ data: fresh.map((code) => ({ code, ...common })) });
  const skipped = existing.size ? `（登録済みの${existing.size}件はスキップ）` : "";
  return { ok: true, message: `${fresh.length}件のコードを登録しました${skipped}` };
}

export async function updateReferral(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const code = codeField.safeParse(String(formData.get("code") ?? ""));
  if (!code.success) return { error: code.error.issues[0].message };
  const dup = await prisma.referral.findFirst({ where: { code: code.data, NOT: { id } } });
  if (dup) return { error: `コード ${code.data} は既に使われています` };

  const campusId = Number(formData.get("campusId"));
  if (!campusId) return { error: "校舎を選択してください" };

  await prisma.referral.update({
    where: { id },
    data: {
      code: code.data,
      campusId,
      enrollmentType: enrollmentType(formData),
      studentName: text(formData, "studentName"),
      referredName: text(formData, "referredName"),
      staffName: text(formData, "staffName"),
      distributedAt: date(formData, "distributedAt"),
      enrolledAt: date(formData, "enrolledAt"),
      paidAt: date(formData, "paidAt"),
      amazonOrderedAt: date(formData, "amazonOrderedAt"),
      giftCode: text(formData, "giftCode"),
      giftSentAt: date(formData, "giftSentAt"),
      note: text(formData, "note"),
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/referrals/${id}`);
  return { ok: true, message: "保存しました" };
}

export async function deleteReferral(id: number): Promise<void> {
  await requireAdmin();
  const count = await prisma.application.count({ where: { referralId: id } });
  if (count > 0) throw new Error("申込みがあるコードは削除できません");
  await prisma.referral.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}

// ---- 保護者申込み ----------------------------------------------------------

export async function setApplicationConfirmed(id: number, confirmed: boolean): Promise<void> {
  await requireAdmin();
  const app = await prisma.application.update({
    where: { id },
    data: { confirmedAt: confirmed ? new Date() : null },
  });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

export async function deleteApplication(id: number): Promise<void> {
  await requireAdmin();
  const app = await prisma.application.delete({ where: { id } });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

// ---- 校舎 ------------------------------------------------------------------

export async function saveCampus(id: number | null, formData: FormData): Promise<void> {
  await requireAdmin();
  const name = text(formData, "name");
  if (!name) return;
  const data = {
    name,
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    active: formData.get("active") === "on",
  };
  if (id) await prisma.campus.update({ where: { id }, data });
  else await prisma.campus.upsert({ where: { name }, update: {}, create: { ...data, active: true } });
  revalidatePath("/admin/campuses");
}
