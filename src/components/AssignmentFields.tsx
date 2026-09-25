"use client";

import type { Referral } from "@prisma/client";
import { DateField } from "@/components/DateField";
import { DuplicateWarning } from "@/components/DuplicateWarning";
import { Field } from "@/components/Field";
import { ENROLLMENT_TYPES } from "@/lib/constants";
import type { DuplicateMatch } from "@/lib/referrals";

// 運用マニュアル STEP3（特典管理への入力）・STEP4（カード配布）の入力欄。経理・校舎の両画面で使う
export function AssignmentFields({
  referral: r,
  duplicates,
  linkBase,
}: {
  referral: Referral;
  duplicates?: DuplicateMatch[];
  linkBase?: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold text-brand-700">特典管理（STEP3）・カード配布（STEP4）</legend>
      <p className="text-xs leading-relaxed text-slate-500">
        入塾・講習申込み（STEP2）から3日以内に入力してください。塾生を入力する場合、紹介された生徒と区分は必須です。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="紹介してくれた塾生" name="studentName">
          <input id="studentName" name="studentName" defaultValue={r.studentName ?? ""} className="input" />
        </Field>
        <Field label="紹介された生徒（外部生）" name="referredName">
          <input id="referredName" name="referredName" defaultValue={r.referredName ?? ""} className="input" />
        </Field>
        <Field label="区分" name="enrollmentType">
          <select id="enrollmentType" name="enrollmentType" defaultValue={r.enrollmentType ?? ""} className="input">
            <option value="">選択してください</option>
            {ENROLLMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="担当者" name="staffName">
          <input id="staffName" name="staffName" defaultValue={r.staffName ?? ""} className="input" />
        </Field>
        <DateField label="入塾日・講習申込日（STEP2）" name="enrolledAt" value={r.enrolledAt} />
        <DateField
          label="カード配布日（塾生へ渡した日）"
          name="cardGivenAt"
          value={r.cardGivenAt}
          hint="保護者の入力期限（1か月）の起点"
        />
      </div>
      {duplicates && duplicates.length > 0 ? (
        <DuplicateWarning duplicates={duplicates} linkBase={linkBase} />
      ) : (
        r.duplicateAck && (
          <label className="flex items-start gap-2 text-sm text-rose-800">
            <input type="checkbox" name="duplicateAck" defaultChecked className="mt-1 size-4 accent-rose-600" />
            同姓同名の別人であることを確認済み
          </label>
        )
      )}
    </fieldset>
  );
}
