"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { applicationSchema, firstErrors, type FieldErrors } from "@/lib/validation";

export type ApplyState = {
  errors: FieldErrors;
  values: Record<string, string>;
};

const FIELDS = [
  "campusId",
  "studentName",
  "guardianName",
  "email",
  "emailConfirm",
  "address",
  "phone",
  "referredGrade",
  "referredName",
  "code",
] as const;

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const values: Record<string, string> = {};
  for (const f of FIELDS) values[f] = String(formData.get(f) ?? "");
  values.agree = formData.get("agree") === "on" ? "on" : "";

  // ボット対策（人には見えない入力欄）
  if (formData.get("website")) redirect("/apply/complete");

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) return { errors: firstErrors(parsed.error), values };
  const input = parsed.data;

  const [referral, campus] = await Promise.all([
    prisma.referral.findUnique({ where: { code: input.code } }),
    prisma.campus.findFirst({ where: { id: input.campusId, active: true } }),
  ]);
  if (!campus) return { errors: { campusId: "所属校舎を選択してください" }, values };
  if (!referral) {
    return {
      errors: {
        code: "招待コードが見つかりません。カードに記載のコードをご確認ください。",
      },
      values,
    };
  }
  if (referral.giftSentAt) {
    return {
      errors: { code: "この招待コードの特典はすでにお送りしています。" },
      values,
    };
  }

  await prisma.application.create({
    data: {
      referralId: referral.id,
      campusId: campus.id,
      studentName: input.studentName,
      guardianName: input.guardianName,
      email: input.email,
      address: input.address,
      phone: input.phone,
      referredGrade: input.referredGrade,
      referredName: input.referredName,
    },
  });

  redirect("/apply/complete");
}
