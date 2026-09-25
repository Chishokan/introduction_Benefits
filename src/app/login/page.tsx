import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "職員ログイン | 紹介特典" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session));
  const campuses = await prisma.campus.findMany({
    where: { active: true, passwordHash: { not: null } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-bold text-brand-700">紹介特典 管理画面</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">担当とパスワードを入力してください</p>
        <LoginForm campuses={campuses} />
      </div>
    </main>
  );
}
