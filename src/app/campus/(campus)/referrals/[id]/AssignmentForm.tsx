"use client";

import type { Referral } from "@prisma/client";
import { useActionState } from "react";
import { AssignmentFields } from "@/components/AssignmentFields";
import { submitWithoutReset } from "@/components/submitWithoutReset";
import { updateAssignment, type ActionState } from "../../../actions";

export function AssignmentForm({ referral, locked }: { referral: Referral; locked: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateAssignment.bind(null, referral.id), {});
  return (
    <form onSubmit={submitWithoutReset(action)} key={referral.updatedAt.toISOString()} className="card space-y-5 p-5">
      <fieldset disabled={locked} className="space-y-5">
        <AssignmentFields referral={referral} duplicates={state.duplicates} />
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || locked} className="btn-primary">
          {pending ? "保存中…" : "保存"}
        </button>
        {locked && <p className="text-sm text-slate-500">特典送付済みのため変更できません（修正は経理へ）</p>}
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
