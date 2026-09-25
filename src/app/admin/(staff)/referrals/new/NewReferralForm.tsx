"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { ENROLLMENT_TYPES } from "@/lib/constants";
import { createReferrals, type ActionState } from "../../../actions";

export function NewReferralForm({
  campuses,
  nextCode,
  today,
}: {
  campuses: { id: number; name: string }[];
  nextCode: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createReferrals, {});
  return (
    <form onSubmit={submitWithoutReset(action)} className="card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="校舎" name="campusId" required>
          <select id="campusId" name="campusId" required className="input">
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="区分" name="enrollmentType">
          <select id="enrollmentType" name="enrollmentType" className="input">
            <option value="">未定</option>
            {ENROLLMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="コード" name="codeFrom" required hint={nextCode && `次の番号: ${nextCode}`}>
          <input id="codeFrom" name="codeFrom" required defaultValue={nextCode} inputMode="numeric" className="input font-mono" />
        </Field>
        <Field label="終了コード（連番登録する場合）" name="codeTo">
          <input id="codeTo" name="codeTo" inputMode="numeric" className="input font-mono" />
        </Field>
        <Field label="塾生（特典を受け取る生徒）" name="studentName">
          <input id="studentName" name="studentName" className="input" />
        </Field>
        <Field label="紹介された方" name="referredName" hint="入塾・講習申込みした方の氏名">
          <input id="referredName" name="referredName" className="input" />
        </Field>
        <Field label="担当者" name="staffName">
          <input id="staffName" name="staffName" className="input" />
        </Field>
        <Field label="校舎配布日" name="distributedAt">
          <input id="distributedAt" name="distributedAt" type="date" defaultValue={today} className="input" />
        </Field>
      </div>
      <Field label="備考" name="note">
        <textarea id="note" name="note" rows={2} className="input" />
      </Field>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        登録する
      </button>
    </form>
  );
}
