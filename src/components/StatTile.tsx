import Link from "next/link";

// 数字1つを見せるタイル。delta は前期間との差（増えて良いかは good で指定）
export function StatTile({
  label,
  value,
  href,
  note,
  delta,
  hero,
  alert,
}: {
  label: string;
  value: number;
  href?: string;
  note?: string;
  delta?: { value: number; period: string };
  hero?: boolean;
  alert?: boolean;
}) {
  const body = (
    <>
      <div className="text-sm text-slate-600">{label}</div>
      <div className={`mt-1 font-semibold text-slate-900 ${hero ? "text-5xl" : "text-3xl"}`}>{value.toLocaleString()}</div>
      {delta && (
        <div className="mt-1 text-xs text-slate-500">
          {delta.period}比{" "}
          <span className="font-semibold text-slate-700">
            {delta.value > 0 ? `+${delta.value}` : delta.value === 0 ? "±0" : delta.value}
          </span>
        </div>
      )}
      {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
    </>
  );
  const cls = `card block p-4 transition ${alert && value > 0 ? "border-rose-300 bg-rose-50/60" : ""} ${
    href ? "hover:border-brand-500" : ""
  }`;
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
