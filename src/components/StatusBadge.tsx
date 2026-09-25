import { STATUSES, type StatusKey } from "@/lib/status";

const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-300",
  sky: "bg-sky-50 text-sky-700 ring-sky-300",
  amber: "bg-amber-50 text-amber-800 ring-amber-300",
  rose: "bg-rose-50 text-rose-700 ring-rose-300",
  violet: "bg-violet-50 text-violet-700 ring-violet-300",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-300",
};

export function StatusBadge({ status }: { status: StatusKey }) {
  const s = STATUSES.find((x) => x.key === status)!;
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[s.tone]}`}
    >
      {s.label}
    </span>
  );
}
