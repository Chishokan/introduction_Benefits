import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireAccounting } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/referrals", label: "特典コード一覧" },
  { href: "/admin/applications", label: "申込み一覧" },
  { href: "/admin/referrals/new", label: "コード登録" },
  { href: "/admin/apply-errors", label: "申込みエラー" },
  { href: "/admin/campuses", label: "校舎・パスワード" },
  { href: "/admin/import", label: "データ取り込み" },
] as const;

export default async function AccountingLayout({ children }: LayoutProps<"/admin">) {
  await requireAccounting();
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-bold text-brand-700">
            紹介特典 管理<span className="ml-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs text-white">経理</span>
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
