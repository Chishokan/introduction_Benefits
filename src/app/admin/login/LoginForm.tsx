"use client";

import { useActionState } from "react";
import { login, type ActionState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">
          パスワード
        </label>
        <input id="password" name="password" type="password" required autoFocus className="input" />
      </div>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        ログイン
      </button>
    </form>
  );
}
