import type { Metadata } from "next";
import { ApplyHeader } from "../Header";

export const metadata: Metadata = { title: "お申込み完了 | 智翔館" };

export default function CompletePage() {
  return (
    <>
      <ApplyHeader />
      <main className="mx-auto -mt-6 w-full max-w-xl flex-1 px-4 pb-16">
        <div className="card space-y-4 p-6 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-brand-700">お申込みを受け付けました</h2>
          <p>
            ご紹介いただき、誠にありがとうございます。
            <br />
            ご紹介いただいた方のご入塾（または講習会のお申込み）と入金を確認したのち、ご入力いただいたメールアドレス宛に
            Amazon ギフトコードをお送りします。
          </p>
          <p className="rounded-lg bg-brand-50 p-3 text-brand-700">
            迷惑メール設定をされている場合は、受信できるよう設定のご確認をお願いします。
          </p>
          <p className="text-slate-500">ご不明な点は、所属校舎までお問い合わせください。</p>
        </div>
      </main>
    </>
  );
}
