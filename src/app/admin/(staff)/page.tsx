import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MonthlyChart } from "@/components/MonthlyChart";
import { RecentApplications } from "@/components/RecentApplications";
import { FlagBar, StatusTiles } from "@/components/ReferralOverview";
import { StatTile } from "@/components/StatTile";
import { campusSummaries, countInWindow, flattenApplications, monthlyCounts } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { listReferrals } from "@/lib/referrals";
import { STATUSES } from "@/lib/status";

export const metadata: Metadata = { title: "ダッシュボード | 紹介特典" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  // 旧 URL（/admin?status=… 等は特典コード一覧だった）
  const sp = await searchParams;
  const legacy = new URLSearchParams();
  for (const k of ["status", "flag", "q", "campus"]) if (typeof sp[k] === "string") legacy.set(k, sp[k] as string);
  if (legacy.size > 0) redirect(`/admin/referrals?${legacy}`);

  const now = new Date();
  const [rows, openErrors] = await Promise.all([
    listReferrals(),
    prisma.applyError.count({ where: { resolvedAt: null } }),
  ]);
  const apps = flattenApplications(rows);
  const unconfirmed = apps.filter((a) => a.valid && !a.confirmedAt);
  const week = countInWindow(
    apps.map((a) => a.createdAt),
    7,
    now,
  );
  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const withIssues = rows.filter((r) => Object.values(r.flags).some(Boolean)).length;
  const campuses = campusSummaries(rows, now).sort((a, b) => a.campusId - b.campusId);
  const statusCols = STATUSES.filter((s) => s.key !== "unassigned");

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">ダッシュボード</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="col-span-2 md:col-span-1 xl:col-span-2">
          <StatTile
            label="未確認の申込み"
            value={unconfirmed.length}
            note="保護者から届いて、まだ内容を確認していない申込み"
            href="/admin/applications?view=unconfirmed"
            hero
            alert
          />
        </div>
        <StatTile label="新規申込み（直近7日）" value={week.current} delta={{ value: week.current - week.previous, period: "前の7日" }} href="/admin/applications" />
        <StatTile label="発注待ち" value={count("ready")} note="申込み・入金がそろった" href="/admin/referrals?status=ready" />
        <StatTile label="送付待ち" value={count("ordered")} note="Amazon 発注済み" href="/admin/referrals?status=ordered" />
        <StatTile label="申込みエラー（未対応）" value={openErrors} href="/admin/apply-errors" alert />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">未確認の申込み</h2>
          {unconfirmed.length > 10 && (
            <Link href="/admin/applications?view=unconfirmed" className="text-sm text-brand-600 hover:underline">
              すべて見る（{unconfirmed.length}件）→
            </Link>
          )}
        </div>
        <RecentApplications apps={unconfirmed.slice(0, 10)} linkBase="/admin/referrals" showCampus empty="未確認の申込みはありません" />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">申請状況</h2>
        <StatusTiles rows={rows} href={(s) => (s ? `/admin/referrals?status=${s}` : "/admin/referrals")} />
        <FlagBar rows={rows} href={(f) => (f ? `/admin/referrals?flag=${f}` : "/admin/referrals")} />
        <p className="text-xs text-slate-500">要対応のある特典コード：{withIssues}件</p>
      </section>

      <section className="grid gap-4 2xl:grid-cols-2">
        <MonthlyChart data={monthlyCounts(apps.map((a) => a.createdAt), 12, now)} title="月別の申込み件数（直近12か月）" />
        <div className="card overflow-x-auto p-4">
          <h3 className="mb-2 font-semibold">校舎別の状況</h3>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="whitespace-nowrap text-left text-xs text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">校舎</th>
                <th className="py-1.5 pr-2 text-right">新規7日</th>
                {statusCols.map((s) => (
                  <th key={s.key} className="py-1.5 pr-2 text-right">
                    {s.label}
                  </th>
                ))}
                <th className="py-1.5 text-right">要対応</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campuses.map((c) => (
                <tr key={c.campusId}>
                  <td className="whitespace-nowrap py-1.5 pr-2">
                    <Link href={`/admin/referrals?campus=${c.campusId}`} className="text-brand-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{c.newApplications}</td>
                  {statusCols.map((s) => (
                    <td key={s.key} className="py-1.5 pr-2 text-right tabular-nums">
                      {c.byStatus[s.key] || <span className="text-slate-300">0</span>}
                    </td>
                  ))}
                  <td className={`py-1.5 text-right tabular-nums ${c.issues > 0 ? "font-semibold text-rose-600" : ""}`}>{c.issues}</td>
                </tr>
              ))}
              {campuses.length === 0 && (
                <tr>
                  <td colSpan={statusCols.length + 3} className="py-6 text-center text-slate-400">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">最近の申込み</h2>
          <Link href="/admin/applications" className="text-sm text-brand-600 hover:underline">
            申込み一覧 →
          </Link>
        </div>
        <RecentApplications apps={apps.slice(0, 10)} linkBase="/admin/referrals" showCampus empty="まだ申込みはありません" />
      </section>
    </div>
  );
}
