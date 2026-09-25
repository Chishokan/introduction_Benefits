import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

const NAV = [
  { href: "/admin", label: "特典コード一覧" },
  { href: "/admin/referrals/new", label: "コード登録" },
  { href: "/admin/campuses", label: "校舎" },
] as const;

export default async function StaffLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-bold text-brand-700">
            紹介特典 管理
          </Link>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-slate-600 hover:text-brand-600">
                {n.label}
              </Link>
            ))}
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
