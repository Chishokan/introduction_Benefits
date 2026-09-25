import type { Metadata } from "next";
import Link from "next/link";
import { RecentApplications } from "@/components/RecentApplications";
import { flattenApplications } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { listReferrals } from "@/lib/referrals";

export const metadata: Metadata = { title: "申込み一覧 | 紹介特典" };

const VIEWS = [
  { key: "all", label: "すべて" },
  { key: "unconfirmed", label: "未確認" },
  { key: "late", label: "期限終了後申請" },
] as const;

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.key === sp.view)?.key ?? "all";
  const campusId = Number(sp.campus) || undefined;
  const [rows, campuses] = await Promise.all([
    listReferrals({ campusId }),
    prisma.campus.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  const all = flattenApplications(rows);
  const apps =
    view === "unconfirmed" ? all.filter((a) => a.valid && !a.confirmedAt) : view === "late" ? all.filter((a) => !a.valid) : all;
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ view: view === "all" ? undefined : view, campus: campusId ? String(campusId) : undefined, ...patch }))
      if (v) p.set(k, v);
    return `/admin/applications${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">申込み一覧</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={href({ view: v.key === "all" ? undefined : v.key })}
            className={`rounded-full px-3 py-1 ring-1 ring-inset ${view === v.key ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"}`}
          >
            {v.label}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-slate-200" />
        <Link href={href({ campus: undefined })} className={`hover:underline ${!campusId ? "font-semibold text-slate-900" : "text-slate-500"}`}>
          全校舎
        </Link>
        {campuses.map((c) => (
          <Link key={c.id} href={href({ campus: String(c.id) })} className={`hover:underline ${campusId === c.id ? "font-semibold text-slate-900" : "text-slate-500"}`}>
            {c.name}
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-500">{apps.length}件（新しい順）</p>
      <RecentApplications apps={apps} linkBase="/admin/referrals" showCampus empty="該当する申込みはありません" />
    </div>
  );
}
