import type { Metadata } from "next";
import Link from "next/link";
import { FlagBar, StatusTiles } from "@/components/ReferralOverview";
import { ReferralTable } from "@/components/ReferralTable";
import { prisma } from "@/lib/db";
import { isFlagKey, listReferrals } from "@/lib/referrals";
import { isStatusKey } from "@/lib/status";

export const metadata: Metadata = { title: "特典コード一覧（経理） | 紹介特典" };

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const campusId = Number(one(sp.campus)) || undefined;
  const status = one(sp.status);
  const q = one(sp.q);
  const flag = one(sp.flag);

  const [campuses, all, openErrors] = await Promise.all([
    prisma.campus.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    listReferrals({ campusId, q }),
    prisma.applyError.count({ where: { resolvedAt: null, ...(campusId ? { campusId } : {}) } }),
  ]);
  const rows = all
    .filter((r) => !isStatusKey(status) || r.status === status)
    .filter((r) => !isFlagKey(flag) || r.flags[flag]);

  const params = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { campus: campusId ? String(campusId) : undefined, status, flag, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return p.toString();
  };
  const query = (patch: Record<string, string | undefined>) => {
    const s = params(patch);
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold">特典コード一覧</h1>
        <div className="flex gap-2">
          <a href={`/admin/export?${params({})}`} className="btn-secondary">
            CSV出力
          </a>
          <Link href="/admin/referrals/new" className="btn-primary">
            ＋ コード登録
          </Link>
        </div>
      </div>

      {openErrors > 0 && (
        <Link
          href="/admin/apply-errors"
          className="block rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          ⚠ 未対応の申込みエラーが {openErrors} 件あります →
        </Link>
      )}

      <StatusTiles rows={all} active={status} href={(s) => query({ status: s })} />
      <FlagBar rows={all} active={flag} href={(f) => query({ flag: f })} />

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

      <ReferralTable rows={rows} linkBase="/admin/referrals" />
    </div>
  );
}
