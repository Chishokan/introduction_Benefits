"use client";

import type { Campus, Referral } from "@prisma/client";
import { useActionState, useRef } from "react";
import { Field } from "@/components/Field";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { ENROLLMENT_TYPES } from "@/lib/constants";
import { toDateInput, todayInput } from "@/lib/dates";
import { updateReferral, type ActionState } from "../../../actions";

function DateField({ label, name, value }: { label: string; name: string; value: Date | null }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field label={label} name={name}>
      <div className="flex gap-1.5">
        <input ref={ref} id={name} name={name} type="date" defaultValue={toDateInput(value)} className="input" />
        <button
          type="button"
          className="btn-secondary shrink-0 px-2 text-xs"
          onClick={() => {
            if (ref.current) ref.current.value = todayInput();
          }}
        >
          今日
        </button>
      </div>
    </Field>
  );
}

export function ReferralForm({ referral: r, campuses }: { referral: Referral; campuses: Campus[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateReferral.bind(null, r.id), {});
  return (
    <form onSubmit={submitWithoutReset(action)} key={r.updatedAt.toISOString()} className="card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="コード" name="code" required>
          <input id="code" name="code" required defaultValue={r.code} className="input font-mono" />
        </Field>
        <Field label="校舎" name="campusId" required>
          <select id="campusId" name="campusId" defaultValue={r.campusId} className="input">
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="区分" name="enrollmentType">
          <select id="enrollmentType" name="enrollmentType" defaultValue={r.enrollmentType ?? ""} className="input">
            <option value="">未定</option>
            {ENROLLMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="担当者" name="staffName">
          <input id="staffName" name="staffName" defaultValue={r.staffName ?? ""} className="input" />
        </Field>
        <Field label="塾生（特典を受け取る生徒）" name="studentName">
          <input id="studentName" name="studentName" defaultValue={r.studentName ?? ""} className="input" />
        </Field>
        <Field label="紹介された方" name="referredName">
          <input id="referredName" name="referredName" defaultValue={r.referredName ?? ""} className="input" />
        </Field>
        <DateField label="校舎配布日" name="distributedAt" value={r.distributedAt} />
      </div>

      <fieldset className="space-y-4 border-t border-slate-100 pt-4">
        <legend className="text-sm font-bold text-brand-700">進捗</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="入塾日・講習申込日" name="enrolledAt" value={r.enrolledAt} />
          <DateField label="入金日" name="paidAt" value={r.paidAt} />
          <DateField label="Amazon 発注日" name="amazonOrderedAt" value={r.amazonOrderedAt} />
          <DateField label="ギフトコード送付日" name="giftSentAt" value={r.giftSentAt} />
        </div>
        <Field label="Amazon ギフトコード" name="giftCode">
          <input id="giftCode" name="giftCode" defaultValue={r.giftCode ?? ""} autoComplete="off" className="input font-mono" />
        </Field>
      </fieldset>

      <Field label="備考" name="note">
        <textarea id="note" name="note" rows={3} defaultValue={r.note ?? ""} className="input" />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "保存中…" : "保存"}
        </button>
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
