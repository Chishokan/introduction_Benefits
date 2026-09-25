import type { Metadata } from "next";
import { ApplyHeader } from "../Header";

export const metadata: Metadata = { title: "入力期限切れ | 智翔館" };

export default function ExpiredPage() {
  return (
    <>
      <ApplyHeader />
      <main className="mx-auto -mt-6 w-full max-w-xl flex-1 px-4 pb-16">
        <div className="card space-y-4 p-6 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-rose-700">入力期限を過ぎています</h2>
          <p>
            誠に恐れ入りますが、ご入力いただいた招待コードは入力期限（カード配布から1か月以内）を過ぎているため、
            今回のお申込みは無効となりました。
          </p>
          <p>ご入力いただいたメールアドレス宛に、同じ内容のお知らせをお送りしています。</p>
          <p className="text-slate-500">ご不明な点やご事情がございましたら、所属校舎までお問い合わせください。</p>
        </div>
      </main>
    </>
  );
}
