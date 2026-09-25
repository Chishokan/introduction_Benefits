// 管理表 CSV の取り込み（経理画面のアップロードと scripts/import-sheet.ts で共通）
import type { PrismaClient } from "@prisma/client";
import { parseCsv } from "./csv";
import { convertSheet, type SheetRow } from "./sheetImport";

export type ImportResult = {
  total: number; // CSV 内の特典コード行数
  created: string[]; // 取り込んだ（dry-run では取り込む予定の）コード
  skipped: string[]; // 登録済みのためスキップしたコード
  duplicatedInFile: string[]; // CSV 内で重複していたコード（先に出た行を採用）
  applications: number; // 一緒に取り込む保護者申込み件数
  newCampuses: string[]; // 新しく作成する校舎
};

// Google スプレッドシートの CSV は UTF-8、Excel で保存した CSV は Shift_JIS のことがあるため両方に対応する
export function decodeCsv(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
}

export function readSheet(text: string): SheetRow[] {
  return convertSheet(parseCsv(text));
}

export async function importSheetRows(
  prisma: PrismaClient,
  rows: SheetRow[],
  { dryRun }: { dryRun: boolean },
): Promise<ImportResult> {
  const seen = new Set<string>();
  const duplicatedInFile: string[] = [];
  const unique = rows.filter((r) => {
    if (seen.has(r.code)) {
      duplicatedInFile.push(r.code);
      return false;
    }
    seen.add(r.code);
    return true;
  });

  const existing = new Set(
    (await prisma.referral.findMany({ where: { code: { in: [...seen] } }, select: { code: true } })).map((r) => r.code),
  );
  const targets = unique.filter((r) => !existing.has(r.code));

  const campusNames = [...new Set(targets.map((r) => r.campus || "未設定"))];
  const campuses = new Map(
    (await prisma.campus.findMany({ where: { name: { in: campusNames } } })).map((c) => [c.name, c.id]),
  );
  const newCampuses = campusNames.filter((n) => !campuses.has(n));

  const result: ImportResult = {
    total: rows.length,
    created: targets.map((r) => r.code),
    skipped: unique.filter((r) => existing.has(r.code)).map((r) => r.code),
    duplicatedInFile,
    applications: targets.filter((r) => r.application).length,
    newCampuses,
  };
  if (dryRun) return result;

  // 見知らぬ校舎名は表記ゆれの可能性があるため、無効（申込フォーム・ログインに出ない）の状態で末尾に作る
  let sortOrder = (await prisma.campus.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
  for (const name of newCampuses) {
    const c = await prisma.campus.upsert({
      where: { name },
      update: {},
      create: { name, active: false, sortOrder: ++sortOrder },
    });
    campuses.set(name, c.id);
  }

  const importedAt = new Date();
  for (const row of targets) {
    const campusId = campuses.get(row.campus || "未設定")!;
    await prisma.referral.create({
      data: {
        code: row.code,
        campusId,
        enrollmentType: row.enrollmentType,
        studentName: row.studentName ?? (row.application?.studentName || null),
        referredName: row.referredName,
        enrolledAt: row.enrolledAt,
        // 管理表には職員入力日時がないため、入塾・申込日に入力済みとみなす（3日超過の警告を出さない）
        assignedAt: row.studentName || row.application ? (row.enrolledAt ?? importedAt) : null,
        paidAt: row.paidAt,
        // 管理表には発注日がないため、送付日（なければ取込日）を発注日とみなす
        amazonOrderedAt: row.amazonOrdered ? (row.giftSentAt ?? importedAt) : null,
        giftSentAt: row.giftSentAt,
        note: row.note,
        // 旧データは同じ外部生の重複チェックの対象外にする（取り込み時点で確認済みとみなす）
        duplicateAck: true,
        applications: row.application
          ? {
              create: {
                ...row.application,
                campusId,
                confirmedAt: row.amazonOrdered ? importedAt : null,
              },
            }
          : undefined,
      },
    });
  }
  return result;
}
