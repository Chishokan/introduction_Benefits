import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { clearCampusPassword, runNoApplyNow, saveCampus, setCampusPassword, setCampusWebhook, testCampusWebhook } from "../../actions";

export const metadata: Metadata = { title: "校舎・パスワード | 紹介特典" };

export default async function CampusesPage({ searchParams }: PageProps<"/admin/campuses">) {
  const { notice } = await searchParams;
  const campuses = await prisma.campus.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { referrals: true } } },
  });
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">校舎・パスワード・通知</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        「有効」を外した校舎は保護者の申込フォームに表示されず、校舎担当者もログインできません。
        <br />
        校舎担当者用パスワードを設定すると、その校舎の担当者がログインして自校舎の状況確認と STEP3・4 の入力ができます（8文字以上）。
      </p>
      {typeof notice === "string" && (
        <p role="status" className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
          {notice}
        </p>
      )}
      <div className="card space-y-2 p-4 text-sm leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800">LINE WORKS 通知</p>
        <p>
          職員入力（STEP3）から1週間経っても保護者の申込みがないコードを、毎朝9時ごろ校舎の LINE WORKS トークルームへ通知します（1コードにつき1回）。
          校舎ごとに、LINE WORKS の「Incoming Webhook」アプリで発行した Webhook URL を設定してください。
        </p>
        <form action={runNoApplyNow}>
          <button type="submit" className="btn-secondary px-2 py-1 text-xs">
            今すぐ通知を実行する
          </button>
        </form>
      </div>
      <div className="card divide-y divide-slate-100">
        {campuses.map((c) => (
          <div key={c.id} className="space-y-2 p-3">
            <form action={saveCampus.bind(null, c.id)} className="flex flex-wrap items-center gap-3">
              <input name="name" defaultValue={c.name} required aria-label="校舎名" className="input w-40" />
              <label className="flex items-center gap-1 text-sm">
                表示順
                <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input w-20" />
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input name="active" type="checkbox" defaultChecked={c.active} className="size-4 accent-brand-600" />
                有効
              </label>
              <span className="text-xs text-slate-400">コード {c._count.referrals}件</span>
              <button type="submit" className="btn-secondary ml-auto">
                保存
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={c.passwordHash ? "text-emerald-700" : "text-slate-400"}>
                校舎担当者パスワード：{c.passwordHash ? "設定済み" : "未設定"}
              </span>
              <form action={setCampusPassword.bind(null, c.id)} className="flex gap-2">
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder={c.passwordHash ? "新しいパスワード" : "パスワードを設定"}
                  aria-label={`${c.name}のパスワード`}
                  className="input w-48 py-1 text-sm"
                />
                <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                  {c.passwordHash ? "変更" : "設定"}
                </button>
              </form>
              {c.passwordHash && (
                <form action={clearCampusPassword.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-rose-600 underline">
                    ログインを無効にする
                  </button>
                </form>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={c.lineWorksWebhookUrl ? "text-emerald-700" : "text-slate-400"}>
                LINE WORKS 通知：{c.lineWorksWebhookUrl ? "設定済み" : "未設定"}
              </span>
              <form action={setCampusWebhook.bind(null, c.id)} className="flex flex-1 gap-2">
                <input
                  name="webhookUrl"
                  type="url"
                  defaultValue={c.lineWorksWebhookUrl ?? ""}
                  placeholder="https://webhook.worksmobile.com/message/..."
                  aria-label={`${c.name}の LINE WORKS Webhook URL`}
                  className="input min-w-64 flex-1 py-1 font-mono text-xs"
                />
                <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                  保存
                </button>
              </form>
              {c.lineWorksWebhookUrl && (
                <form action={testCampusWebhook.bind(null, c.id)}>
                  <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                    テスト送信
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        <form action={saveCampus.bind(null, null)} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3">
          <input name="name" required placeholder="新しい校舎名" aria-label="新しい校舎名" className="input w-40" />
          <input name="sortOrder" type="number" defaultValue={campuses.length + 1} aria-label="表示順" className="input w-20" />
          <button type="submit" className="btn-primary ml-auto">
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
