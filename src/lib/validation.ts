import { z } from "zod";
import { GRADES } from "./constants";
import { normalizeCode, normalizeName, normalizePhone } from "./normalize";

const required = (label: string) =>
  z.string().trim().min(1, `${label}を入力してください`);

const fields = z.object({
  campusId: z.coerce.number().int().positive("所属校舎を選択してください"),
  studentName: required("生徒名").transform(normalizeName),
  guardianName: required("保護者名").transform(normalizeName),
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  emailConfirm: z.string().trim(),
  address: required("ご住所"),
  phone: required("電話番号")
    .transform(normalizePhone)
    .refine((v) => /^0\d{9,10}$/.test(v), "電話番号は0から始まる10〜11桁で入力してください"),
  referredGrade: z.enum(GRADES, { error: "ご紹介した方の学年を選択してください" }),
  referredName: required("ご紹介した方の氏名").transform(normalizeName),
  code: required("招待コード")
    .transform(normalizeCode)
    .refine((v) => /^\d{4,10}$/.test(v), "招待コードは数字で入力してください"),
  agree: z.literal("on", { error: "個人情報の取り扱いに同意してください" }),
});

const emailPair = fields.pick({ email: true, emailConfirm: true });

export const applicationSchema = fields.refine(
  (v) => v.email.toLowerCase() === v.emailConfirm.toLowerCase(),
  {
    path: ["emailConfirm"],
    message: "確認用メールアドレスが一致しません",
    // 他の項目にエラーがあっても、メールアドレス欄が正しければ一致チェックを行う
    when: (payload) => emailPair.safeParse(payload.value).success,
  },
);

export type ApplicationInput = z.infer<typeof applicationSchema>;

export type FieldErrors = Partial<Record<string, string>>;

export function firstErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
