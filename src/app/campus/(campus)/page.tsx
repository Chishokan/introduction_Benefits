import type { Metadata } from "next";
import Link from "next/link";
import { ApplyErrorList } from "@/components/ApplyErrorList";
import { RecentApplications } from "@/components/RecentApplications";
import { StatTile } from "@/components/StatTile";
import { countInWindow, flattenApplications } from "@/lib/dashboard";
import { FlagBar, StatusTiles } from "@/components/ReferralOverview";
import { ReferralTable } from "@/components/ReferralTable";
import { requireCampus } from "@/lib/auth";
import { FLAGS, isFlagKey, listApplyErrors, listReferrals } from "@/lib/referrals";
import { isStatusKey } from "@/lib/status";

export const metadata: Metadata = { title: "状況確認（校舎） | 紹介特典" };

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function CampusHome({ searchParams }: PageProps<"/campus">) {
  const campusId = await requireCampus();
  const sp = await searchParams;
  const status = one(sp.status);
  const flag = one(sp.flag);
  const q = one(sp.q);

  const [all, errors] = await Promise.all([listReferrals({ campusId, q }), listApplyErrors(campusId)]);
  const rows = all
    .filter((r) => !isStatusKey(status) || r.status === status)
    .filter((r) => !isFlagKey(flag) || r.flags[flag]);
  const openErrors = errors.filter((e) => !e.resolvedAt);
  // 検索・絞り込みに関係なく自校舎全体で集計する
  const whole = q ? await listReferrals({ campusId }) : all;
  const apps = flattenApplications(whole);
  const week = countInWindow(
    apps.map((a) => a.createdAt),
    7,
    new Date(),
  );
  const waiting = whole.filter((r) => r.status === "distributed").length;
  const dueSoon = whole.filter((r) => r.flags.dueSoon).length;
  const withIssues = whole.filter((r) => Object.values(r.flags).some(Boolean)).length + openErrors.length;
  const issues = FLAGS.map((f) => ({ ...f, rows: all.filter((r) => r.flags[f.key]) })).filter((f) => f.rows.length > 0);

  const query = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, flag, q, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/campus?${s}` : "/campus";
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold">状況・エラー確認</h1>
        <form action="/campus/find" className="flex items-end gap-2">
          <div>
            <label htmlFor="code" className="label">
              カードのコード番号で開く
            </label>
            <input id="code" name="code" inputMode="numeric" required placeholder="例）109135" className="input w-40 font-mono" />
          </div>
          <button type="submit" className="btn-primary">
            開く
          </button>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="新規申込み（直近7日）"
          value={week.current}
          delta={{ value: week.current - week.previous, period: "前の7日" }}
        />
        <StatTile label="保護者の申込待ち" value={waiting} href="/campus?status=distributed" note="カードを渡して申込みがまだ" />
        <StatTile label="入力期限7日以内" value={dueSoon} href="/campus?flag=dueSoon" note="保護者へ声かけを" alert />
        <StatTile label="要対応" value={withIssues} note="下の一覧を確認してください" alert />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">新着の申込み</h2>
        <RecentApplications apps={apps.slice(0, 5)} linkBase="/campus/referrals" empty="まだ申込みはありません" />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">要対応</h2>
        {issues.length === 0 && openErrors.length === 0 && (
          <div className="card p-6 text-center text-sm text-emerald-700">対応が必要な項目はありません</div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {issues.map((f) => (
            <div key={f.key} className="card border-rose-200 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-rose-700">{f.label}</h3>
                <Link href={query({ flag: f.key, status: undefined })} className="text-sm text-brand-600 hover:underline">
                  {f.rows.length}件 →
                </Link>
              </div>
              <p className="mt-1 text-xs text-slate-500">{f.hint}</p>
              <ul className="mt-2 space-y-0.5 text-sm">
                {f.rows.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link href={`/campus/referrals/${r.id}`} className="font-mono text-brand-600 hover:underline">
                      {r.code}
                    </Link>
                    <span className="ml-2 text-slate-600">
                      {r.studentName ?? "（塾生未入力）"} → {r.referredName ?? "—"}
                    </span>
                  </li>
                ))}
                {f.rows.length > 5 && <li className="text-xs text-slate-400">ほか {f.rows.length - 5} 件</li>}
              </ul>
            </div>
          ))}
        </div>
        {openErrors.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-rose-700">
              申込みエラー（未対応 {openErrors.length} 件）
              <span className="ml-2 text-xs font-normal text-slate-500">
                保護者が送信できなかった申込みです。保護者へ連絡し、正しいコードで再入力をお願いしてください。
              </span>
            </h3>
            <ApplyErrorList errors={openErrors} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">特典コードの状況</h2>
        <StatusTiles rows={all} active={status} href={(s) => query({ status: s })} />
        <FlagBar rows={all} active={flag} href={(f) => query({ flag: f })} />
        <form className="card flex flex-wrap items-end gap-3 p-3" action="/campus">
          {status && <input type="hidden" name="status" value={status} />}
          {flag && <input type="hidden" name="flag" value={flag} />}
          <div className="min-w-60 flex-1">
            <label htmlFor="q" className="label">
              検索
            </label>
            <input id="q" name="q" defaultValue={q} placeholder="コード・生徒名・保護者名など" className="input" />
          </div>
          <button type="submit" className="btn-primary">
            絞り込み
          </button>
          {(q || status || flag) && (
            <Link href="/campus" className="btn-secondary">
              クリア
            </Link>
          )}
        </form>
        <ReferralTable rows={rows} linkBase="/campus/referrals" />
      </section>
    </div>
  );
}
