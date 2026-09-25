"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { expiryNoticeMail } from "@/lib/mailTemplates";
import { isAfterQrDeadline, qrDeadlineDate } from "@/lib/rules";
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

  // 招待コードの誤り等で受け付けられなかった申込みは、校舎が保護者へ連絡できるよう記録する
  const logError = (reason: "not_found" | "gift_sent") =>
    prisma.applyError.create({
      data: {
        code: input.code,
        reason,
        campusId: campus.id,
        studentName: input.studentName,
        guardianName: input.guardianName,
        email: input.email,
        phone: input.phone,
      },
    });

  if (!referral) {
    await logError("not_found");
    return {
      errors: {
        code: "招待コードが見つかりません。カードに記載のコードをご確認ください。",
      },
      values,
    };
  }
  if (referral.giftSentAt) {
    await logError("gift_sent");
    return {
      errors: { code: "この招待コードの特典はすでにお送りしています。" },
      values,
    };
  }

  // カード配布から1か月を過ぎた入力は無効。記録は残し（管理画面に「期限終了後申請」と表示）、保護者へ通知する
  const late = isAfterQrDeadline(referral.cardGivenAt, new Date());

  const application = await prisma.application.create({
    data: {
      late,
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

  if (late && referral.cardGivenAt) {
    const sent = await sendMail({
      to: input.email,
      ...expiryNoticeMail({
        guardianName: input.guardianName,
        code: referral.code,
        campusName: campus.name,
        deadline: qrDeadlineDate(referral.cardGivenAt),
      }),
    });
    if (sent) {
      await prisma.application.update({ where: { id: application.id }, data: { expiryNoticeSentAt: new Date() } });
    }
    redirect("/apply/expired");
  }

  redirect("/apply/complete");
}
