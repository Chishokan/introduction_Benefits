"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { login, type LoginState } from "./actions";

export function LoginForm({ campuses }: { campuses: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    // 失敗時に「担当」の選択が経理に戻らないよう、送信後にフォームをリセットしない
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <div>
        <label htmlFor="who" className="label">
          担当
        </label>
        <select id="who" name="who" className="input" defaultValue="accounting">
          <option value="accounting">経理</option>
          {campuses.length > 0 && (
            <optgroup label="校舎担当者">
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label htmlFor="password" className="label">
          パスワード
        </label>
        <input id="password" name="password" type="password" required className="input" />
      </div>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        ログイン
      </button>
    </form>
  );
}
