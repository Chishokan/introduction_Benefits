// Vercel のビルド処理。本番デプロイ（VERCEL_ENV=production）のときだけ DB を更新する。
//   1. prisma generate
//   2. 本番のみ: prisma migrate deploy（テーブル作成・変更）→ 校舎の初期登録（未登録時のみ）
//   3. next build
// プレビューデプロイでは本番 DB を変更しない。

import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const isProduction = process.env.VERCEL_ENV === "production";

run("npx prisma generate");
if (isProduction) {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error("DATABASE_URL と DIRECT_URL を Vercel の環境変数（Production）に設定してください");
  }
  run("npx prisma migrate deploy");
  run("npx prisma db seed");
} else {
  console.log(`VERCEL_ENV=${process.env.VERCEL_ENV ?? "(未設定)"} のため DB の更新はスキップします`);
}
run("npx next build");
