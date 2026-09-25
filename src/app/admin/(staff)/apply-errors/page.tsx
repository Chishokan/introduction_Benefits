import type { Metadata } from "next";
import { ApplyErrorList } from "@/components/ApplyErrorList";
import { listApplyErrors } from "@/lib/referrals";

export const metadata: Metadata = { title: "申込みエラー | 紹介特典" };

export default async function ApplyErrorsPage() {
  const errors = await listApplyErrors();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">申込みエラー</h1>
      <p className="text-sm text-slate-600">
        保護者が申込フォームで送信できなかった記録です（招待コードの入力誤りなど）。校舎担当者の画面にも表示されます。
      </p>
      <ApplyErrorList errors={errors} showCampus />
    </div>
  );
}
