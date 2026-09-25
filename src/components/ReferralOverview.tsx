import Link from "next/link";
import { FLAGS, type FlagKey, type ReferralRow } from "@/lib/referrals";
import { STATUSES, type StatusKey } from "@/lib/status";

// 状態別件数のタイル（クリックで絞り込み）
export function StatusTiles({
  rows,
  active,
  href,
}: {
  rows: ReferralRow[];
  active?: string;
  href: (status: StatusKey | undefined) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {STATUSES.map((s) => {
        const on = active === s.key;
        return (
          <Link
            key={s.key}
            href={href(on ? undefined : s.key)}
            className={`card p-3 transition hover:border-brand-500 ${on ? "border-brand-500 ring-2 ring-brand-100" : ""}`}
          >
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="text-2xl font-bold tabular-nums">{rows.filter((r) => r.status === s.key).length}</div>
          </Link>
        );
      })}
    </div>
  );
}

// 要対応（エラー）の件数ボタン
export function FlagBar({
  rows,
  active,
  href,
}: {
  rows: ReferralRow[];
  active?: string;
  href: (flag: FlagKey | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-slate-600">要対応：</span>
      {FLAGS.map((f) => {
        const on = active === f.key;
        const n = rows.filter((r) => r.flags[f.key]).length;
        return (
          <Link
            key={f.key}
            href={href(on ? undefined : f.key)}
            title={f.hint}
            className={`rounded-full px-3 py-1 ring-1 ring-inset transition ${
              on
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
  );
}

export function FlagBadges({ flags }: { flags: ReferralRow["flags"] }) {
  const on = FLAGS.filter((f) => flags[f.key]);
  if (on.length === 0) return null;
  return (
    <div className="flex flex-col items-start gap-0.5">
      {on.map((f) => (
        <span key={f.key} title={f.hint} className="text-xs font-semibold text-rose-600">
          {f.short}
        </span>
      ))}
    </div>
  );
}
