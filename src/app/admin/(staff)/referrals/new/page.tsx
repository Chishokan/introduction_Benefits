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
      <div className="space-y-1 text-sm leading-relaxed text-slate-600">
        <p>
          印刷したカードを校舎へ配布するときは「終了コード」まで入力すると連番でまとめて登録できます。
        </p>
        <p>
          紹介が成立したら（入塾・講習申込み＝STEP2）、<strong>3日以内</strong>
          に塾生・紹介された生徒・区分を入力してから、塾生へカードを渡してください。保護者の入力期限はカード配布日から1か月です。
        </p>
        <p>紹介された外部生1名につき特典は1回限りです。過去に同じ外部生が登録されている場合は警告が表示されます。</p>
      </div>
      <NewReferralForm campuses={campuses} nextCode={nextCode} today={todayInput()} />
    </div>
  );
}
