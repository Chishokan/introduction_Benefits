import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { RecentApplication } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/dates";

export function RecentApplications({
  apps,
  linkBase,
  showCampus,
  empty,
}: {
  apps: RecentApplication[];
  linkBase: string;
  showCampus?: boolean;
  empty: string;
}) {
  if (apps.length === 0) return <div className="card p-6 text-center text-sm text-slate-400">{empty}</div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">受付日時</th>
            {showCampus && <th className="px-3 py-2">校舎</th>}
            <th className="px-3 py-2">コード</th>
            <th className="px-3 py-2">保護者 / 塾生</th>
            <th className="px-3 py-2">紹介した方</th>
            <th className="px-3 py-2">確認</th>
            <th className="px-3 py-2">状態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((a) => (
            <tr key={a.id} className="hover:bg-brand-50/50">
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDateTime(a.createdAt)}</td>
              {showCampus && <td className="whitespace-nowrap px-3 py-2">{a.referral.campusName}</td>}
              <td className="px-3 py-2 font-mono">
                <Link href={`${linkBase}/${a.referral.id}`} className="font-semibold text-brand-600 hover:underline">
                  {a.referral.code}
                </Link>
              </td>
              <td className="px-3 py-2">
                {a.guardianName}
                <span className="text-xs text-slate-500"> / {a.studentName}</span>
              </td>
              <td className="px-3 py-2">
                {a.referredGrade} {a.referredName}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                {!a.valid ? (
                  <span className="font-semibold text-rose-600">期限終了後申請</span>
                ) : a.confirmedAt ? (
                  <span className="text-emerald-700">✓ 確認済み</span>
                ) : (
                  <span className="font-semibold text-amber-700">未確認</span>
                )}
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={a.referral.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
