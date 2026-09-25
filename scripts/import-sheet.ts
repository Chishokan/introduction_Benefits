// 使い方: npm run import:sheet -- <管理表.csv> [--dry-run]
// 通常は経理画面の「データ取り込み」から CSV をアップロードする。こちらは PC から直接取り込む場合用。

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { decodeCsv, importSheetRows, readSheet } from "../src/lib/importSheet";

const prisma = new PrismaClient();

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) throw new Error("CSV ファイルを指定してください");
  const dryRun = flags.includes("--dry-run");
  const buf = readFileSync(file);
  const rows = readSheet(decodeCsv(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  const r = await importSheetRows(prisma, rows, { dryRun });
  console.log(
    `${dryRun ? "[dry-run] " : ""}取込 ${r.created.length} 件（うち保護者申込み ${r.applications} 件）/ 登録済みでスキップ ${r.skipped.length} 件` +
      (r.duplicatedInFile.length ? ` / CSV 内の重複 ${r.duplicatedInFile.join(", ")}` : "") +
      (r.newCampuses.length ? ` / 新しい校舎 ${r.newCampuses.join(", ")}` : ""),
  );
}

main().finally(() => prisma.$disconnect());
