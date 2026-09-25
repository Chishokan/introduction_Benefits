import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAMPUSES = ["日野校", "日宇校", "大野校", "佐々校"];

async function main() {
  for (const [i, name] of CAMPUSES.entries()) {
    await prisma.campus.upsert({ where: { name }, update: {}, create: { name, sortOrder: i + 1 } });
  }
  console.log(`校舎 ${CAMPUSES.length} 件を登録しました`);
}

main().finally(() => prisma.$disconnect());
