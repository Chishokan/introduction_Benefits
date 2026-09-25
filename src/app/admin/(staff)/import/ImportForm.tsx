"use client";

import { useActionState, useState } from "react";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { importSheet, type ImportState } from "../../actions";

function CodeList({ label, codes }: { label: string; codes: string[] }) {
  if (codes.length === 0) return null;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-slate-600">
        {label}（{codes.length}件）
      </summary>
      <p className="mt-1 break-all font-mono text-slate-500">{codes.join(", ")}</p>
    </details>
  );
}

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importSheet, {});
  const [mode, setMode] = useState<"check" | "import">("check");
  const r = state.result;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          const pressed = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "import" ? "import" : "check";
          if (pressed === "import" && !confirm("取り込みを実行します。よろしいですか？")) {
            e.preventDefault();
            return;
          }
          setMode(pressed);
          submitWithoutReset(action)(e);
        }}
        className="card flex flex-wrap items-end gap-3 p-4"
      >
        <div className="min-w-64 flex-1">
          <label htmlFor="file" className="label">
            管理表の CSV
          </label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="input py-1.5" />
        </div>
        <button type="submit" name="mode" value="check" disabled={pending} className="btn-secondary">
          {pending && mode === "check" ? "確認中…" : "確認する"}
        </button>
        <button type="submit" name="mode" value="import" disabled={pending} className="btn-primary">
          {pending && mode === "import" ? "取り込み中…" : "取り込む"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      {r && (
        <div
          className={`card space-y-2 p-4 text-sm ${state.dryRun ? "" : "border-emerald-300 bg-emerald-50/50"}`}
          role="status"
        >
          <p className="font-semibold">
            {state.dryRun ? "確認結果（まだ取り込んでいません）" : "取り込みました"}：{state.fileName}
          </p>
          <ul className="space-y-0.5">
            <li>
              CSV の特典コード行：<strong>{r.total}</strong> 件
            </li>
            <li>
              {state.dryRun ? "取り込む" : "取り込んだ"}コード：<strong>{r.created.length}</strong> 件（うち保護者申込みあり{" "}
              {r.applications} 件）
            </li>
            <li>
              登録済みのためスキップ：<strong>{r.skipped.length}</strong> 件
            </li>
            {r.newCampuses.length > 0 && (
              <li className="text-amber-700">
                新しく作成する校舎：{r.newCampuses.join("、")}（無効の状態で作成します。正しい校舎なら「校舎・パスワード」で有効にしてください。表記ゆれの場合は CSV
                の校舎名を直してから取り込むのがおすすめです）
              </li>
            )}
            {r.duplicatedInFile.length > 0 && (
              <li className="text-amber-700">CSV 内で重複しているコード（最初の行を採用）：{r.duplicatedInFile.join(", ")}</li>
            )}
          </ul>
          <CodeList label={state.dryRun ? "取り込むコード" : "取り込んだコード"} codes={r.created} />
          <CodeList label="スキップしたコード" codes={r.skipped} />
          {state.dryRun && r.created.length > 0 && (
            <p className="text-xs text-slate-500">内容に問題がなければ、同じファイルを選んだまま「取り込む」を押してください。</p>
          )}
        </div>
      )}
    </div>
  );
}
