import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "職員ログイン | 紹介特典" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-bold text-brand-700">紹介特典 管理画面</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">職員用パスワードを入力してください</p>
        <LoginForm />
      </div>
    </main>
  );
}
