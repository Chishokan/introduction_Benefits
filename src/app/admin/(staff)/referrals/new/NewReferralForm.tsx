"use client";

import { useActionState } from "react";
import { DuplicateWarning } from "@/components/DuplicateWarning";
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
            <option value="">選択してください</option>
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
        <Field label="校舎配布日" name="distributedAt" hint="印刷したカードを校舎へ送った日">
          <input id="distributedAt" name="distributedAt" type="date" className="input" />
        </Field>
        <Field label="担当者" name="staffName">
          <input id="staffName" name="staffName" className="input" />
        </Field>
      </div>

      <fieldset className="space-y-4 border-t border-slate-100 pt-4">
        <legend className="text-sm font-bold text-brand-700">特典管理（STEP3）・カード配布（STEP4）※1件登録のみ</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="紹介してくれた塾生" name="studentName">
            <input id="studentName" name="studentName" className="input" />
          </Field>
          <Field label="紹介された生徒（外部生）" name="referredName">
            <input id="referredName" name="referredName" className="input" />
          </Field>
          <Field label="入塾日・講習申込日（STEP2）" name="enrolledAt">
            <input id="enrolledAt" name="enrolledAt" type="date" className="input" />
          </Field>
          <Field label="カード配布日（塾生へ渡した日）" name="cardGivenAt" hint="保護者の入力期限（1か月）の起点">
            <input id="cardGivenAt" name="cardGivenAt" type="date" defaultValue={today} className="input" />
          </Field>
        </div>
        {state.duplicates && state.duplicates.length > 0 && <DuplicateWarning duplicates={state.duplicates} />}
      </fieldset>

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
