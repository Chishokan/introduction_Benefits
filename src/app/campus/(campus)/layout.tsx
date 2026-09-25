import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireCampus } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CampusLayout({ children }: LayoutProps<"/campus">) {
  const campusId = await requireCampus();
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/campus" className="font-bold text-brand-700">
            紹介特典 状況確認
            <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs text-slate-900">{campus?.name}</span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            <Link href="/campus" className="text-slate-600 hover:text-brand-600">
              状況・エラー
            </Link>
            <Link href="/apply" target="_blank" className="text-slate-600 hover:text-brand-600">
              申込フォーム↗
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
