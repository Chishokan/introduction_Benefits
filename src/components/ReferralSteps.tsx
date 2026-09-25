import type { Referral } from "@prisma/client";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { DuplicateMatch } from "@/lib/referrals";
import { isStaffInputDelayed, qrDeadlineDate, staffInputDeadlineDate } from "@/lib/rules";
import type { StatusKey } from "@/lib/status";

// STEP3〜5 の入力日・期限と、外部生の重複警告
export function ReferralSteps({
  referral,
  status,
  earlier,
  linkBase,
}: {
  referral: Referral;
  status: StatusKey;
  earlier: DuplicateMatch[];
  linkBase?: string;
}) {
  const delayed = isStaffInputDelayed(referral.enrolledAt, referral.assignedAt, new Date());
  const qrDeadline = referral.cardGivenAt ? qrDeadlineDate(referral.cardGivenAt) : null;
  return (
    <>
      <div className="card grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs text-slate-500">職員入力（STEP3）</div>
          {referral.assignedAt ? formatDateTime(referral.assignedAt) : <span className="text-slate-400">未入力</span>}
          {referral.enrolledAt && (
            <div className={`text-xs ${delayed ? "font-semibold text-rose-600" : "text-slate-500"}`}>
              期限 {formatDate(staffInputDeadlineDate(referral.enrolledAt))}
              {delayed && " ⚠ 3日超過"}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-slate-500">カード配布（STEP4）</div>
          {referral.cardGivenAt ? formatDate(referral.cardGivenAt) : <span className="text-slate-400">未入力</span>}
        </div>
        <div>
          <div className="text-xs text-slate-500">保護者の入力期限（STEP5）</div>
          {qrDeadline ? (
            <span className={status === "expired" ? "font-semibold text-rose-600" : ""}>
              {formatDate(qrDeadline)} まで{status === "expired" && "（期限切れ）"}
            </span>
          ) : (
            <span className="text-slate-400">カード配布日の入力で設定</span>
          )}
        </div>
      </div>

      {earlier.length > 0 && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          ⚠ 紹介された外部生「{referral.referredName}」は、先に登録されたコード
          {earlier.map((d) =>
            linkBase ? (
              <Link key={d.id} href={`${linkBase}/${d.id}`} className="mx-1 font-mono font-semibold underline">
                {d.code}
              </Link>
            ) : (
              <span key={d.id} className="mx-1 font-mono font-semibold">
                {d.code}
              </span>
            ),
          )}
          でも特典対象になっています。外部生1名につき特典は1回のみです。
        </div>
      )}
    </>
  );
}
