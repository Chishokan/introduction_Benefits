"use client";

import type { Campus, Referral } from "@prisma/client";
import { useActionState } from "react";
import { AssignmentFields } from "@/components/AssignmentFields";
import { DateField } from "@/components/DateField";
import { Field } from "@/components/Field";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { updateReferral, type ActionState } from "../../../actions";

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
        <DateField label="校舎配布日" name="distributedAt" value={r.distributedAt} hint="印刷したカードを校舎へ送った日" />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <AssignmentFields referral={r} duplicates={state.duplicates} linkBase="/admin/referrals" />
      </div>

      <fieldset className="space-y-4 border-t border-slate-100 pt-4">
        <legend className="text-sm font-bold text-brand-700">入金・特典送付（経理）</legend>
        <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "保存中…" : "保存"}
        </button>
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
