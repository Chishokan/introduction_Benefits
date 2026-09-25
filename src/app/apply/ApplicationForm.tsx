"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
import { GRADES } from "@/lib/constants";
import { submitApplication, type ApplyState } from "./actions";

type Campus = { id: number; name: string };

export function ApplicationForm({
  campuses,
  initialCode,
  initialCampusId,
}: {
  campuses: Campus[];
  initialCode: string;
  initialCampusId: number | null;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {
    errors: {},
    values: { code: initialCode, campusId: initialCampusId ? String(initialCampusId) : "" },
  });
  const v = state.values;
  const e = state.errors;
  const hasErrors = Object.keys(e).length > 0;
  const invalid = (name: string) =>
    e[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    // key で送信ごとに再マウントし、エラー時も入力値を残す
    <form action={action} key={JSON.stringify(v)} className="space-y-6" noValidate>
      {hasErrors && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          入力内容をご確認ください。
        </div>
      )}

      <section className="card space-y-5 p-5">
        <h2 className="text-base font-bold text-brand-700">招待コード</h2>
        <Field
          label="招待コード"
          name="code"
          required
          hint="カード表面に記載されている数字をご入力ください。コード1つにつき1回のみご利用いただけます。"
          error={e.code}
        >
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={v.code}
            placeholder="例）109135"
            className="input font-mono tracking-widest"
            {...invalid("code")}
          />
        </Field>
      </section>

      <section className="card space-y-5 p-5">
        <h2 className="text-base font-bold text-brand-700">塾生・保護者の方の情報</h2>
        <Field label="所属校舎" name="campusId" required error={e.campusId}>
          <select id="campusId" name="campusId" defaultValue={v.campusId} className="input" {...invalid("campusId")}>
            <option value="">選択してください</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="生徒名（塾生）" name="studentName" required error={e.studentName}>
          <input
            id="studentName"
            name="studentName"
            defaultValue={v.studentName}
            placeholder="例）智翔 太郎"
            className="input"
            {...invalid("studentName")}
          />
        </Field>
        <Field label="保護者名" name="guardianName" required error={e.guardianName}>
          <input
            id="guardianName"
            name="guardianName"
            autoComplete="name"
            defaultValue={v.guardianName}
            placeholder="例）智翔 花子"
            className="input"
            {...invalid("guardianName")}
          />
        </Field>
        <Field
          label="メールアドレス"
          name="email"
          required
          hint="ご入力いただいたアドレス宛に Amazon ギフトコードが届きます。迷惑メール設定をされている場合は設定のご確認をお願いします。"
          error={e.email}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v.email}
            className="input"
            {...invalid("email")}
          />
        </Field>
        <Field label="メールアドレス（確認用）" name="emailConfirm" required error={e.emailConfirm}>
          <input
            id="emailConfirm"
            name="emailConfirm"
            type="email"
            autoComplete="off"
            defaultValue={v.emailConfirm}
            className="input"
            onPaste={(ev) => ev.preventDefault()}
            {...invalid("emailConfirm")}
          />
        </Field>
        <Field label="ご住所" name="address" required error={e.address}>
          <input
            id="address"
            name="address"
            autoComplete="street-address"
            defaultValue={v.address}
            placeholder="例）佐世保市〇〇町1-2-3"
            className="input"
            {...invalid("address")}
          />
        </Field>
        <Field label="電話番号" name="phone" required error={e.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={v.phone}
            placeholder="例）09012345678"
            className="input"
            {...invalid("phone")}
          />
        </Field>
      </section>

      <section className="card space-y-5 p-5">
        <h2 className="text-base font-bold text-brand-700">ご紹介いただいた方</h2>
        <p className="-mt-2 text-xs leading-relaxed text-slate-500">
          学年と氏名（フルネーム）をご入力ください。入力に誤りがある場合はギフトコードが送信されませんのでご注意ください。
        </p>
        <Field label="学年" name="referredGrade" required error={e.referredGrade}>
          <select
            id="referredGrade"
            name="referredGrade"
            defaultValue={v.referredGrade}
            className="input"
            {...invalid("referredGrade")}
          >
            <option value="">選択してください</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="氏名（フルネーム）" name="referredName" required error={e.referredName}>
          <input
            id="referredName"
            name="referredName"
            defaultValue={v.referredName}
            placeholder="例）智翔館 次郎"
            className="input"
            {...invalid("referredName")}
          />
        </Field>
      </section>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section className="card space-y-3 p-5 text-sm">
        <p className="leading-relaxed text-slate-600">
          ご入力いただいた個人情報は、紹介特典の送付および本件に関するご連絡のみに利用し、法令に基づく場合を除き第三者に提供することはありません。
        </p>
        <label className="flex items-start gap-2 font-semibold">
          <input
            type="checkbox"
            name="agree"
            defaultChecked={v.agree === "on"}
            className="mt-1 size-4 accent-brand-600"
            aria-describedby={e.agree ? "agree-error" : undefined}
          />
          個人情報の取り扱いに同意する
        </label>
        {e.agree && (
          <p id="agree-error" className="text-sm text-rose-600">
            {e.agree}
          </p>
        )}
      </section>

      <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
        {pending ? "送信中…" : "送信する"}
      </button>
    </form>
  );
}
