import type { Metadata } from "next";
import { todayInput } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { NewReferralForm } from "./NewReferralForm";

export const metadata: Metadata = { title: "コード登録 | 紹介特典" };

export default async function NewReferralPage() {
  const campuses = await prisma.campus.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  const last = await prisma.referral.findFirst({ orderBy: { code: "desc" }, select: { code: true } });
  const nextCode = last && /^\d+$/.test(last.code) ? String(Number(last.code) + 1).padStart(last.code.length, "0") : "";

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">特典コード登録</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        紹介カードに印字したコードを登録します。印刷したカードを校舎へ配布するときは「終了コード」まで入力すると連番でまとめて登録できます。
        生徒にカードを渡したら、一覧からコードを開いて塾生（特典を受け取る生徒）と紹介された方を入力してください。
      </p>
      <NewReferralForm campuses={campuses} nextCode={nextCode} today={todayInput()} />
    </div>
  );
}
