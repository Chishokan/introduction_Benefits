// 使い方: npm run import:sheet -- <管理表.csv> [--dry-run]
// Google スプレッドシートの「管理表」をファイル > ダウンロード > CSV で書き出して取り込む。
// 既に登録済みのコードはスキップする。

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { parseCsv } from "../src/lib/csv";
import { convertSheet } from "../src/lib/sheetImport";

const prisma = new PrismaClient();

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) throw new Error("CSV ファイルを指定してください");
  const dryRun = flags.includes("--dry-run");
  const rows = convertSheet(parseCsv(readFileSync(file, "utf8")));

  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (await prisma.referral.findUnique({ where: { code: row.code } })) {
      skipped++;
      continue;
    }
    if (dryRun) {
      created++;
      continue;
    }
    const campus = await prisma.campus.upsert({
      where: { name: row.campus || "未設定" },
      update: {},
      create: { name: row.campus || "未設定" },
    });
    await prisma.referral.create({
      data: {
        code: row.code,
        campusId: campus.id,
        enrollmentType: row.enrollmentType,
        studentName: row.studentName ?? row.application?.studentName ?? null,
        referredName: row.referredName,
        enrolledAt: row.enrolledAt,
        // 管理表には職員入力日時がないため、入塾・申込日に入力済みとみなす（3日超過の警告を出さない）
        assignedAt: row.studentName ? (row.enrolledAt ?? new Date()) : null,
        paidAt: row.paidAt,
        // 管理表には発注日がないため、送付日（なければ取込日）を発注日とみなす
        amazonOrderedAt: row.amazonOrdered ? (row.giftSentAt ?? new Date()) : null,
        giftSentAt: row.giftSentAt,
        note: row.note,
        applications: row.application
          ? { create: { ...row.application, campusId: campus.id, confirmedAt: row.amazonOrdered ? new Date() : null } }
          : undefined,
      },
    });
    created++;
  }
  console.log(`${dryRun ? "[dry-run] " : ""}取込 ${created} 件 / 登録済みでスキップ ${skipped} 件`);
}

main().finally(() => prisma.$disconnect());
