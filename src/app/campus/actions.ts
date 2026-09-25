"use server";

import { revalidatePath } from "next/cache";
import { requireCampus } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignmentData, checkAssignment, type ActionState } from "@/lib/formData";

export type { ActionState };

// 校舎担当者の入力は STEP3（塾生・紹介された生徒・区分）と STEP4（カード配布日）のみ
export async function updateAssignment(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const campusId = await requireCampus();
  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral || referral.campusId !== campusId) return { error: "この校舎のコードではありません" };
  if (referral.giftSentAt) return { error: "特典送付済みのため変更できません。修正が必要な場合は経理へ連絡してください" };

  const assignment = await checkAssignment(formData, id);
  if (assignment) return assignment;

  await prisma.referral.update({ where: { id }, data: assignmentData(formData, referral.assignedAt) });
  revalidatePath("/", "layout");
  return { ok: true, message: "保存しました" };
}
