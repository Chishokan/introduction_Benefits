import type { Metadata } from "next";
import { ImportForm } from "./ImportForm";

export const metadata: Metadata = { title: "データ取り込み | 紹介特典" };

export default function ImportPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">データ取り込み（スプレッドシートから移行）</h1>
      <div className="card space-y-2 p-4 text-sm leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800">手順</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Google スプレッドシート「【中等部】紹介特典（回答）」で取り込むシートを開き、
            <strong>ファイル → ダウンロード → カンマ区切り形式（.csv）</strong>で保存
          </li>
          <li>下のフォームで CSV を選び、まず「確認する」で件数を確認</li>
          <li>問題なければ「取り込む」</li>
        </ol>
        <p>
          シートは <strong>新しい順</strong>（管理表 → 20266月末まで管理表 → 2025管理表 → 2024年度管理表）に取り込んでください。
          登録済みのコードはスキップされるため、同じコードが複数のシートにある場合は先に取り込んだ（新しい）シートの内容が残ります。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>見出し行（「校舎名」を含む行）から列を自動で判定します。</li>
          <li>「Amazon発注済み」が TRUE の行は、メール送信日時を発注日・送付日として取り込みます。</li>
          <li>見出しのない列（「7/2校舎配布」などのメモ）は備考にまとめます。先頭の 0 が落ちた電話番号は補います。</li>
          <li>旧データにはカード配布日がないため、1か月期限・3日期限・外部生の重複の判定はかけません。</li>
          <li>CSV には保護者の個人情報が含まれます。取り込み後は PC から削除してください。</li>
        </ul>
      </div>
      <ImportForm />
    </div>
  );
}
