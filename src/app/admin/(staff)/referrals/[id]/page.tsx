import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlagBadges } from "@/components/ReferralOverview";
import { ReferralSteps } from "@/components/ReferralSteps";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail";
import { sameName } from "@/lib/normalize";
import { findDuplicateReferred, getReferralRow, withStatus } from "@/lib/referrals";
import { isValidApplication } from "@/lib/rules";
import {
  approveLateApplication,
  deleteApplication,
  deleteReferral,
  resendExpiryNotice,
  revokeLateApproval,
  setApplicationConfirmed,
} from "../../../actions";
import { ReferralForm } from "./ReferralForm";

export const metadata: Metadata = { title: "特典コード詳細 | 紹介特典" };

export default async function ReferralPage({ params }: PageProps<"/admin/referrals/[id]">) {
  const { id } = await params;
  const referral = await prisma.referral.findUnique({
    where: { id: Number(id) || 0 },
    include: { campus: true, applications: { include: { campus: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!referral) notFound();

  const campuses = await prisma.campus.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const status = withStatus(referral);
  const duplicates = referral.duplicateAck ? [] : await findDuplicateReferred(referral.referredName, referral.id);
  const earlier = duplicates.filter((d) => d.id < referral.id);
  const flags = (await getReferralRow(referral.id))?.flags;
  const h = await headers();
  const origin = process.env.APP_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const applyUrl = `${origin}/apply?code=${referral.code}`;
  const mailReady = isMailConfigured();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/referrals" className="text-sm text-slate-500 hover:text-brand-600">
          ← 一覧
        </Link>
        <h1 className="font-mono text-2xl font-bold">{referral.code}</h1>
        <StatusBadge status={status} />
        <span className="text-sm text-slate-500">{referral.campus.name}</span>
        {flags && <FlagBadges flags={flags} />}
      </div>

      <ReferralSteps referral={referral} status={status} earlier={earlier} linkBase="/admin/referrals" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-3">
          <h2 className="font-bold">職員入力・進捗</h2>
          <ReferralForm referral={referral} campuses={campuses} />
          {referral.applications.length === 0 && (
            <form action={deleteReferral.bind(null, referral.id)}>
              <button type="submit" className="btn-danger">
                このコードを削除
              </button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-bold">保護者からの申込み（{referral.applications.length}件）</h2>
          <div className="card p-3 text-xs text-slate-600">
            申込フォームURL（QRコード用）:
            <code className="ml-1 break-all rounded bg-slate-100 px-1 py-0.5">{applyUrl}</code>
          </div>
          {referral.applications.length === 0 && (
            <div className="card p-6 text-center text-sm text-slate-400">まだ申込みはありません</div>
          )}
          {referral.applications.map((a, i) => {
            const mismatch = referral.referredName && !sameName(a.referredName, referral.referredName);
            return (
              <article
                key={a.id}
                className={`card space-y-3 p-4 text-sm ${isValidApplication(a) ? "" : "border-rose-300 bg-rose-50/40"}`}
              >
                {a.late && (
                  <div className="space-y-2 rounded-lg border border-rose-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">期限終了後申請</span>
                      {a.exceptionAt ? (
                        <span className="text-xs font-semibold text-emerald-700">
                          特例承認済み {formatDateTime(a.exceptionAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-rose-700">無効（特典対象外）</span>
                      )}
                      <span className="text-xs text-slate-500">
                        期限切れ通知メール：
                        {a.expiryNoticeSentAt ? `送信済み ${formatDateTime(a.expiryNoticeSentAt)}` : "未送信"}
                      </span>
                    </div>
                    {a.exceptionAt ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span>理由：{a.exceptionNote}</span>
                        <form action={revokeLateApproval.bind(null, a.id)}>
                          <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                            特例承認を取り消す
                          </button>
                        </form>
                      </div>
                    ) : (
                      <>
                        <form action={approveLateApplication.bind(null, a.id)} className="flex flex-wrap gap-2">
                          <input
                            name="exceptionNote"
                            required
                            placeholder="特例の理由（校舎責任者・NEP相談の結果）"
                            aria-label="特例の理由"
                            className="input min-w-52 flex-1 py-1 text-sm"
                          />
                          <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                            特例として有効にする
                          </button>
                        </form>
                        {!a.expiryNoticeSentAt && (
                          <form action={resendExpiryNotice.bind(null, a.id)}>
                            <button type="submit" className="btn-secondary px-2 py-1 text-xs" disabled={!mailReady}>
                              期限切れ通知メールを送信
                            </button>
                            {!mailReady && <span className="ml-2 text-xs text-slate-500">（メール送信設定が未設定です）</span>}
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {formatDateTime(a.createdAt)} 受付
                    {i === 0 && referral.applications.length > 1 && (
                      <span className="ml-2 rounded bg-amber-100 px-1 text-amber-800">最新</span>
                    )}
                  </span>
                  {a.confirmedAt ? (
                    <span className="text-xs font-semibold text-emerald-700">✓ 確認済み {formatDateTime(a.confirmedAt)}</span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">未確認</span>
                  )}
                </div>
                <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5">
                  <dt className="text-slate-500">所属校舎</dt>
                  <dd>{a.campus.name}</dd>
                  <dt className="text-slate-500">生徒名</dt>
                  <dd>
                    {a.studentName}
                    {referral.studentName && !sameName(a.studentName, referral.studentName) && (
                      <span className="ml-2 text-xs text-rose-600">⚠ 職員入力「{referral.studentName}」と不一致</span>
                    )}
                  </dd>
                  <dt className="text-slate-500">保護者名</dt>
                  <dd>{a.guardianName}</dd>
                  <dt className="text-slate-500">メール</dt>
                  <dd className="break-all">
                    <a href={`mailto:${a.email}`} className="text-brand-600 hover:underline">
                      {a.email}
                    </a>
                  </dd>
                  <dt className="text-slate-500">住所</dt>
                  <dd>{a.address}</dd>
                  <dt className="text-slate-500">電話番号</dt>
                  <dd className="tabular-nums">{a.phone}</dd>
                  <dt className="text-slate-500">紹介した方</dt>
                  <dd>
                    {a.referredGrade} {a.referredName}
                    {mismatch && (
                      <span className="ml-2 text-xs text-rose-600">⚠ 職員入力「{referral.referredName}」と不一致</span>
                    )}
                  </dd>
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <form action={setApplicationConfirmed.bind(null, a.id, !a.confirmedAt)}>
                    <button type="submit" className={a.confirmedAt ? "btn-secondary" : "btn-primary"}>
                      {a.confirmedAt ? "確認を取り消す" : "内容を確認済みにする"}
                    </button>
                  </form>
                  <form action={deleteApplication.bind(null, a.id)}>
                    <button type="submit" className="btn-danger">
                      申込みを削除
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
