import Link from "next/link";
import { FlagBadges } from "@/components/ReferralOverview";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/dates";
import type { ReferralRow } from "@/lib/referrals";

export function ReferralTable({ rows, linkBase }: { rows: ReferralRow[]; linkBase: string }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">コード</th>
            <th className="px-3 py-2">校舎</th>
            <th className="px-3 py-2">区分</th>
            <th className="px-3 py-2">紹介してくれた塾生</th>
            <th className="px-3 py-2">紹介された生徒</th>
            <th className="px-3 py-2">保護者申込</th>
            <th className="px-3 py-2">カード配布日</th>
            <th className="px-3 py-2">入金日</th>
            <th className="px-3 py-2">送付日</th>
            <th className="px-3 py-2">状態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const app = r.applications[0];
            return (
              <tr key={r.id} className="hover:bg-brand-50/50">
                <td className="px-3 py-2 font-mono">
                  <Link href={`${linkBase}/${r.id}`} className="font-semibold text-brand-600 hover:underline">
                    {r.code}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2">{r.campus.name}</td>
                <td className="whitespace-nowrap px-3 py-2">{r.enrollmentType}</td>
                <td className="px-3 py-2">{r.studentName}</td>
                <td className="px-3 py-2">{r.referredName}</td>
                <td className="px-3 py-2">
                  {app ? (
                    <div className="space-y-0.5">
                      <div>
                        {app.guardianName}
                        {r.applications.length > 1 && (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-xs text-amber-800">
                            {r.applications.length}件
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {app.referredGrade} {app.referredName}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{formatDate(r.cardGivenAt)}</td>
                <td className="px-3 py-2 tabular-nums">{formatDate(r.paidAt)}</td>
                <td className="px-3 py-2 tabular-nums">{formatDate(r.giftSentAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={r.status} />
                    <FlagBadges flags={r.flags} />
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-3 py-10 text-center text-slate-400">
                該当する特典コードはありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
