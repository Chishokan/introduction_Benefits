import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAMPUSES = ["日野校", "日宇校", "大野校", "佐々校"];

// 初回だけ校舎を登録する（校舎が1件でもあれば何もしない。以降は管理画面の「校舎」で管理）
async function main() {
  if ((await prisma.campus.count()) > 0) {
    console.log("校舎は登録済みのためスキップしました");
    return;
  }
  await prisma.campus.createMany({ data: CAMPUSES.map((name, i) => ({ name, sortOrder: i + 1 })) });
  console.log(`校舎 ${CAMPUSES.length} 件を登録しました`);
}

main().finally(() => prisma.$disconnect());
