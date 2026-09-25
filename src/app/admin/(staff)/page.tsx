import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { sameName } from "@/lib/normalize";
import { FLAGS, isFlagKey, listReferrals } from "@/lib/referrals";
import { STATUSES, isStatusKey } from "@/lib/status";

export const metadata: Metadata = { title: "特典コード一覧 | 紹介特典" };

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const campusId = Number(one(sp.campus)) || undefined;
  const status = one(sp.status);
  const q = one(sp.q);
  const flag = one(sp.flag);

  const [campuses, all] = await Promise.all([
    prisma.campus.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    listReferrals({ campusId, q }),
  ]);
  const rows = all
    .filter((r) => !isStatusKey(status) || r.status === status)
    .filter((r) => !isFlagKey(flag) || r.flags[flag]);
  const counts = Object.fromEntries(STATUSES.map((s) => [s.key, all.filter((r) => r.status === s.key).length]));
  const flagCounts = Object.fromEntries(FLAGS.map((f) => [f.key, all.filter((r) => r.flags[f.key]).length]));

  const query = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { campus: campusId ? String(campusId) : undefined, status, flag, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };
  const exportHref = `/admin/export?${new URLSearchParams(
    Object.entries({ campus: campusId ? String(campusId) : "", status: status ?? "", flag: flag ?? "", q: q ?? "" }).filter(([, v]) => v),
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold">特典コード一覧</h1>
        <div className="flex gap-2">
          <a href={exportHref} className="btn-secondary">
            CSV出力
          </a>
          <Link href="/admin/referrals/new" className="btn-primary">
            ＋ コード登録
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STATUSES.map((s) => {
          const active = status === s.key;
          return (
            <Link
              key={s.key}
              href={query({ status: active ? undefined : s.key })}
              className={`card p-3 transition hover:border-brand-500 ${active ? "border-brand-500 ring-2 ring-brand-100" : ""}`}
            >
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-2xl font-bold tabular-nums">{counts[s.key]}</div>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-600">要対応：</span>
        {FLAGS.map((f) => {
          const active = flag === f.key;
          const n = flagCounts[f.key];
          return (
            <Link
              key={f.key}
              href={query({ flag: active ? undefined : f.key })}
              className={`rounded-full px-3 py-1 ring-1 ring-inset transition ${
                active
                  ? "bg-rose-600 text-white ring-rose-600"
                  : n > 0
                    ? "bg-rose-50 text-rose-700 ring-rose-300 hover:bg-rose-100"
                    : "bg-white text-slate-400 ring-slate-200"
              }`}
            >
              {f.label} <span className="font-bold tabular-nums">{n}</span>
            </Link>
          );
        })}
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-3" action="/admin">
        {status && <input type="hidden" name="status" value={status} />}
        {flag && <input type="hidden" name="flag" value={flag} />}
        <div>
          <label htmlFor="campus" className="label">
            校舎
          </label>
          <select id="campus" name="campus" defaultValue={campusId ?? ""} className="input">
            <option value="">すべて</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-60 flex-1">
          <label htmlFor="q" className="label">
            検索
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="コード・生徒名・保護者名・メールアドレスなど"
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary">
          絞り込み
        </button>
        {(campusId || q || status || flag) && (
          <Link href="/admin" className="btn-secondary">
            クリア
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">校舎</th>
              <th className="px-3 py-2">区分</th>
              <th className="px-3 py-2">塾生（特典対象）</th>
              <th className="px-3 py-2">紹介された方</th>
              <th className="px-3 py-2">保護者申込</th>
              <th className="px-3 py-2">入塾・申込日</th>
              <th className="px-3 py-2">入金日</th>
              <th className="px-3 py-2">送付日</th>
              <th className="px-3 py-2">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const app = r.applications[0];
              const mismatch = app && r.referredName && !sameName(app.referredName, r.referredName);
              return (
                <tr key={r.id} className="hover:bg-brand-50/50">
                  <td className="px-3 py-2 font-mono">
                    <Link href={`/admin/referrals/${r.id}`} className="font-semibold text-brand-600 hover:underline">
                      {r.code}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.campus.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.enrollmentType}</td>
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
                          {mismatch && (
                            <span className="ml-1 text-rose-600" title="職員入力の「紹介された方」と一致しません">
                              ⚠ 要確認
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatDate(r.enrolledAt)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatDate(r.paidAt)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatDate(r.giftSentAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={r.status} />
                      {r.flags.late && <span className="text-xs font-semibold text-rose-600">期限終了後申請</span>}
                      {r.flags.delayed && <span className="text-xs font-semibold text-rose-600">入力3日超過</span>}
                      {r.flags.duplicate && <span className="text-xs font-semibold text-rose-600">外部生重複?</span>}
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
    </div>
  );
}
