// 「職員入力から1週間経っても保護者申込みがない」コードを校舎ごとにまとめて LINE WORKS へ通知する
import type { PrismaClient } from "@prisma/client";
import { formatDate } from "./dates";
import { sendLineWorks, type LineWorksMessage } from "./lineworks";
import { needsNoApplyNotice, qrDeadlineDate } from "./rules";

const MAX_LINES = 20;

export type NoApplyItem = {
  code: string;
  studentName: string | null;
  referredName: string | null;
  assignedAt: Date | null;
  cardGivenAt: Date | null;
};

export function buildNoApplyMessage(campusName: string, items: NoApplyItem[], appUrl: string | undefined): LineWorksMessage {
  const lines = items.slice(0, MAX_LINES).map((r) => {
    const deadline = r.cardGivenAt ? `・入力期限 ${formatDate(qrDeadlineDate(r.cardGivenAt))}` : "";
    return `・${r.code} 塾生 ${r.studentName ?? "—"} → 紹介 ${r.referredName ?? "—"}（職員入力 ${formatDate(r.assignedAt)}${deadline}）`;
  });
  if (items.length > MAX_LINES) lines.push(`ほか ${items.length - MAX_LINES} 件`);
  return {
    title: `【紹介特典】保護者の申込みがありません（${campusName}）`,
    text: [
      `職員入力から1週間経っても保護者の申込みがないコードが ${items.length} 件あります。`,
      "塾生・保護者の方へ声かけをお願いします。",
      "",
      ...lines,
    ].join("\n"),
    ...(appUrl ? { button: { label: "状況を確認する", url: `${appUrl}/campus?flag=noApplyWeek` } } : {}),
  };
}

export type NoApplyRunResult = {
  campus: string;
  targets: number;
  sent: boolean;
  skipped?: "no_webhook";
}[];

export async function runNoApplyNotices(prisma: PrismaClient, now = new Date()): Promise<NoApplyRunResult> {
  const candidates = await prisma.referral.findMany({
    where: {
      studentName: { not: null },
      assignedAt: { not: null, lte: new Date(now.getTime() - 7 * 86_400_000) },
      giftSentAt: null,
      noApplyNotifiedAt: null,
      applications: { none: {} },
    },
    include: { campus: true, _count: { select: { applications: true } } },
    orderBy: { code: "asc" },
  });
  const targets = candidates.filter((r) => needsNoApplyNotice({ ...r, applicationCount: r._count.applications }, now));

  const byCampus = new Map<number, typeof targets>();
  for (const r of targets) byCampus.set(r.campusId, [...(byCampus.get(r.campusId) ?? []), r]);

  const result: NoApplyRunResult = [];
  for (const items of byCampus.values()) {
    const campus = items[0].campus;
    // Webhook 未設定の校舎は通知済みにしない（設定後の実行でまとめて通知される）
    if (!campus.lineWorksWebhookUrl) {
      result.push({ campus: campus.name, targets: items.length, sent: false, skipped: "no_webhook" });
      continue;
    }
    const sent = await sendLineWorks(campus.lineWorksWebhookUrl, buildNoApplyMessage(campus.name, items, process.env.APP_URL));
    if (sent) {
      await prisma.referral.updateMany({ where: { id: { in: items.map((r) => r.id) } }, data: { noApplyNotifiedAt: now } });
    }
    result.push({ campus: campus.name, targets: items.length, sent });
  }
  return result;
}
