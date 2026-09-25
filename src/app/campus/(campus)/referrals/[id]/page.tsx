import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlagBadges } from "@/components/ReferralOverview";
import { ReferralSteps } from "@/components/ReferralSteps";
import { StatusBadge } from "@/components/StatusBadge";
import { requireCampus } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import { sameName } from "@/lib/normalize";
import { findDuplicateReferred, getReferralRow } from "@/lib/referrals";
import { isValidApplication } from "@/lib/rules";
import { AssignmentForm } from "./AssignmentForm";

export const metadata: Metadata = { title: "特典コード（校舎） | 紹介特典" };

export default async function CampusReferralPage({ params }: PageProps<"/campus/referrals/[id]">) {
  const campusId = await requireCampus();
  const { id } = await params;
  const referral = await getReferralRow(Number(id) || 0);
  // 他校舎のコードは存在しないものとして扱う
  if (!referral || referral.campusId !== campusId) notFound();

  const duplicates = referral.duplicateAck ? [] : await findDuplicateReferred(referral.referredName, referral.id);
  const earlier = duplicates.filter((d) => d.id < referral.id);
  const progress = [
    ["入金日", formatDate(referral.paidAt)],
    ["Amazon 発注日", formatDate(referral.amazonOrderedAt)],
    ["ギフトコード送付日", formatDate(referral.giftSentAt)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/campus" className="text-sm text-slate-500 hover:text-brand-600">
          ← 一覧
        </Link>
        <h1 className="font-mono text-2xl font-bold">{referral.code}</h1>
        <StatusBadge status={referral.status} />
        <FlagBadges flags={referral.flags} />
      </div>

      <ReferralSteps referral={referral} status={referral.status} earlier={earlier} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-3">
          <h2 className="font-bold">STEP3・4 の入力</h2>
          <AssignmentForm referral={referral} locked={!!referral.giftSentAt} />

          <h2 className="pt-2 font-bold">入金・特典送付（経理入力）</h2>
          <dl className="card grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 p-4 text-sm">
            {progress.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-slate-500">{label}</dt>
                <dd>{value || <span className="text-slate-400">—</span>}</dd>
              </div>
            ))}
            <dt className="text-slate-500">経理備考</dt>
            <dd className="whitespace-pre-wrap">{referral.note || <span className="text-slate-400">—</span>}</dd>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold">保護者からの申込み（{referral.applications.length}件）</h2>
          {referral.applications.length === 0 && (
            <div className="card p-6 text-center text-sm text-slate-400">まだ申込みはありません</div>
          )}
          {referral.applications.map((a) => (
            <article
              key={a.id}
              className={`card space-y-2 p-4 text-sm ${isValidApplication(a) ? "" : "border-rose-300 bg-rose-50/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">{formatDateTime(a.createdAt)} 受付</span>
                {a.late &&
                  (a.exceptionAt ? (
                    <span className="font-semibold text-emerald-700">期限終了後申請（特例承認済み）</span>
                  ) : (
                    <span className="rounded bg-rose-600 px-1.5 py-0.5 font-bold text-white">期限終了後申請・無効</span>
                  ))}
                {a.late && !a.exceptionAt && (
                  <span className="text-slate-500">
                    通知メール：{a.expiryNoticeSentAt ? `送信済み ${formatDateTime(a.expiryNoticeSentAt)}` : "未送信"}
                  </span>
                )}
                <span className={a.confirmedAt ? "text-emerald-700" : "text-amber-700"}>
                  {a.confirmedAt ? "経理確認済み" : "経理未確認"}
                </span>
              </div>
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
                <dt className="text-slate-500">生徒名</dt>
                <dd>
                  {a.studentName}
                  {referral.studentName && !sameName(a.studentName, referral.studentName) && (
                    <span className="ml-2 text-xs text-rose-600">⚠ 職員入力「{referral.studentName}」と不一致</span>
                  )}
                </dd>
                <dt className="text-slate-500">保護者名</dt>
                <dd>{a.guardianName}</dd>
                <dt className="text-slate-500">連絡先</dt>
                <dd className="break-all">
                  {a.email} / <span className="tabular-nums">{a.phone}</span>
                </dd>
                <dt className="text-slate-500">紹介した方</dt>
                <dd>
                  {a.referredGrade} {a.referredName}
                  {referral.referredName && !sameName(a.referredName, referral.referredName) && (
                    <span className="ml-2 text-xs text-rose-600">⚠ 職員入力「{referral.referredName}」と不一致</span>
                  )}
                </dd>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
