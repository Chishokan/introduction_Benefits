import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { saveCampus } from "../../actions";

export const metadata: Metadata = { title: "校舎 | 紹介特典" };

export default async function CampusesPage() {
  const campuses = await prisma.campus.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { referrals: true } } },
  });
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">校舎</h1>
      <p className="text-sm text-slate-600">「有効」を外した校舎は保護者の申込フォームに表示されません。</p>
      <div className="card divide-y divide-slate-100">
        {campuses.map((c) => (
          <form key={c.id} action={saveCampus.bind(null, c.id)} className="flex flex-wrap items-center gap-3 p-3">
            <input name="name" defaultValue={c.name} required aria-label="校舎名" className="input w-40" />
            <label className="flex items-center gap-1 text-sm">
              表示順
              <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input w-20" />
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input name="active" type="checkbox" defaultChecked={c.active} className="size-4 accent-brand-600" />
              有効
            </label>
            <span className="text-xs text-slate-400">コード {c._count.referrals}件</span>
            <button type="submit" className="btn-secondary ml-auto">
              保存
            </button>
          </form>
        ))}
        <form action={saveCampus.bind(null, null)} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3">
          <input name="name" required placeholder="新しい校舎名" aria-label="新しい校舎名" className="input w-40" />
          <input name="sortOrder" type="number" defaultValue={campuses.length + 1} aria-label="表示順" className="input w-20" />
          <button type="submit" className="btn-primary ml-auto">
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
