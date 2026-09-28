import { prisma } from "@/lib/db";
import { runNoApplyNotices } from "@/lib/noApplyNotice";

// Vercel Cron から毎日呼ばれる（vercel.json の crons）。
// Vercel は環境変数 CRON_SECRET を Authorization: Bearer ヘッダーに付けて呼び出す。
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runNoApplyNotices(prisma);
  console.info("[cron] no-application", JSON.stringify(result));
  return Response.json({ ok: true, result });
}
