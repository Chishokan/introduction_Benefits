"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccounting } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { expiryNoticeMail } from "@/lib/mailTemplates";
import {
  assignmentData,
  checkAssignment,
  date,
  enrollmentType,
  personName,
  text,
  type ActionState,
} from "@/lib/formData";
import { normalizeCode } from "@/lib/normalize";
import { qrDeadlineDate } from "@/lib/rules";
import { decodeCsv, importSheetRows, readSheet, type ImportResult } from "@/lib/importSheet";
import { hashPassword } from "@/lib/session";

export type { ActionState };

const MAX_RANGE = 500;

// ---- 特典コード ------------------------------------------------------------

const codeField = z
  .string()
  .transform(normalizeCode)
  .refine((v) => /^\d{4,10}$/.test(v), "コードは4〜10桁の数字で入力してください");

export async function createReferrals(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAccounting();

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

  const studentName = personName(formData, "studentName");
  if (studentName && codes.length > 1) {
    return { error: "連番登録では塾生を入力できません。1件ずつ登録してください" };
  }
  const assignment = await checkAssignment(formData);
  if (assignment) return assignment;

  const common = {
    campusId,
    enrollmentType: enrollmentType(formData),
    studentName,
    referredName: personName(formData, "referredName"),
    staffName: text(formData, "staffName"),
    distributedAt: date(formData, "distributedAt"),
    enrolledAt: date(formData, "enrolledAt"),
    assignedAt: studentName ? new Date() : null,
    cardGivenAt: studentName ? date(formData, "cardGivenAt") : null,
    duplicateAck: formData.get("duplicateAck") === "on",
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
  await requireAccounting();

  const code = codeField.safeParse(String(formData.get("code") ?? ""));
  if (!code.success) return { error: code.error.issues[0].message };
  const dup = await prisma.referral.findFirst({ where: { code: code.data, NOT: { id } } });
  if (dup) return { error: `コード ${code.data} は既に使われています` };

  const campusId = Number(formData.get("campusId"));
  if (!campusId) return { error: "校舎を選択してください" };

  const assignment = await checkAssignment(formData, id);
  if (assignment) return assignment;

  const current = await prisma.referral.findUnique({ where: { id }, select: { assignedAt: true } });

  await prisma.referral.update({
    where: { id },
    data: {
      code: code.data,
      campusId,
      distributedAt: date(formData, "distributedAt"),
      ...assignmentData(formData, current?.assignedAt ?? null),
      paidAt: date(formData, "paidAt"),
      amazonOrderedAt: date(formData, "amazonOrderedAt"),
      giftCode: text(formData, "giftCode"),
      giftSentAt: date(formData, "giftSentAt"),
      note: text(formData, "note"),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "保存しました" };
}

export async function deleteReferral(id: number): Promise<void> {
  await requireAccounting();
  const count = await prisma.application.count({ where: { referralId: id } });
  if (count > 0) throw new Error("申込みがあるコードは削除できません");
  await prisma.referral.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}

// ---- 保護者申込み ----------------------------------------------------------

export async function setApplicationConfirmed(id: number, confirmed: boolean): Promise<void> {
  await requireAccounting();
  const app = await prisma.application.update({
    where: { id },
    data: { confirmedAt: confirmed ? new Date() : null },
  });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

// 期限超過の申請を特例として有効にする（校舎責任者・NEP 相談の上）
export async function approveLateApplication(id: number, formData: FormData): Promise<void> {
  await requireAccounting();
  const note = text(formData, "exceptionNote");
  if (!note) throw new Error("特例の理由を入力してください");
  const app = await prisma.application.update({
    where: { id },
    data: { exceptionAt: new Date(), exceptionNote: note },
  });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

export async function revokeLateApproval(id: number): Promise<void> {
  await requireAccounting();
  const app = await prisma.application.update({
    where: { id },
    data: { exceptionAt: null, exceptionNote: null },
  });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

export async function resendExpiryNotice(id: number): Promise<void> {
  await requireAccounting();
  const app = await prisma.application.findUniqueOrThrow({
    where: { id },
    include: { referral: true, campus: true },
  });
  if (!app.late || !app.referral.cardGivenAt) return;
  const sent = await sendMail({
    to: app.email,
    ...expiryNoticeMail({
      guardianName: app.guardianName,
      code: app.referral.code,
      campusName: app.campus.name,
      deadline: qrDeadlineDate(app.referral.cardGivenAt),
    }),
  });
  if (sent) await prisma.application.update({ where: { id }, data: { expiryNoticeSentAt: new Date() } });
  revalidatePath(`/admin/referrals/${app.referralId}`);
}

export async function deleteApplication(id: number): Promise<void> {
  await requireAccounting();
  const app = await prisma.application.delete({ where: { id } });
  revalidatePath(`/admin/referrals/${app.referralId}`);
  revalidatePath("/admin");
}

// ---- 校舎 ------------------------------------------------------------------

export async function saveCampus(id: number | null, formData: FormData): Promise<void> {
  await requireAccounting();
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

// 校舎担当者ログイン用のパスワードを設定する（空欄なら変更しない）
export async function setCampusPassword(id: number, formData: FormData): Promise<void> {
  await requireAccounting();
  const password = text(formData, "password");
  if (!password || password.length < 8) throw new Error("パスワードは8文字以上にしてください");
  await prisma.campus.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  revalidatePath("/admin/campuses");
}

export async function clearCampusPassword(id: number): Promise<void> {
  await requireAccounting();
  await prisma.campus.update({ where: { id }, data: { passwordHash: null } });
  revalidatePath("/admin/campuses");
}

// ---- 管理表 CSV の取り込み --------------------------------------------------

export type ImportState = { error?: string; dryRun?: boolean; fileName?: string; result?: ImportResult };

const MAX_CSV_BYTES = 3 * 1024 * 1024;

export async function importSheet(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAccounting();
  const file = formData.get("file");
  const dryRun = formData.get("mode") !== "import";
  if (!(file instanceof File) || file.size === 0) return { error: "CSV ファイルを選択してください" };
  if (file.size > MAX_CSV_BYTES) return { error: "ファイルが大きすぎます（3MB まで）" };

  let rows;
  try {
    rows = readSheet(decodeCsv(await file.arrayBuffer()));
  } catch (e) {
    return { error: `CSV を読み取れませんでした: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (rows.length === 0) return { error: "特典コードの行が見つかりませんでした。管理表のシートを CSV で書き出したか確認してください" };

  const result = await importSheetRows(prisma, rows, { dryRun });
  if (!dryRun) revalidatePath("/", "layout");
  return { dryRun, fileName: file.name, result };
}
