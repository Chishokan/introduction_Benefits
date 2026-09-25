import "server-only";
import { ENROLLMENT_TYPES } from "./constants";
import { parseDateInput } from "./dates";
import { normalizeName } from "./normalize";
import { findDuplicateReferred, type DuplicateMatch } from "./referrals";

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  // 紹介された外部生が過去に特典対象になっている場合の該当コード
  duplicates?: DuplicateMatch[];
};

export function text(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v === "" ? null : v;
}

export function date(formData: FormData, name: string): Date | null {
  return parseDateInput(text(formData, name));
}

export function personName(formData: FormData, key: string): string | null {
  const v = text(formData, key);
  return v ? normalizeName(v) : null;
}

export function enrollmentType(formData: FormData): string | null {
  const v = text(formData, "enrollmentType");
  return v && (ENROLLMENT_TYPES as readonly string[]).includes(v) ? v : null;
}

// 生徒への割当（運用マニュアル STEP3）の入力チェック。
// 塾生名を入れる場合は「紹介された生徒名」「区分」を必須とし、同じ外部生の重複を確認する。
export async function checkAssignment(formData: FormData, excludeId?: number): Promise<ActionState | null> {
  if (!text(formData, "studentName")) return null;
  if (!text(formData, "referredName")) return { error: "紹介された生徒名を入力してください" };
  if (!enrollmentType(formData)) return { error: "区分（通常入会／講習会申込み）を選択してください" };
  if (formData.get("duplicateAck") === "on") return null;
  const duplicates = await findDuplicateReferred(text(formData, "referredName"), excludeId);
  if (duplicates.length === 0) return null;
  return {
    error:
      "この外部生は過去に紹介特典の対象として登録されています。外部生1名につき特典は1回のみです（講習会・入塾を問わず）。",
    duplicates,
  };
}

// STEP3/4 の入力値（経理・校舎の両画面で共通）
export function assignmentData(formData: FormData, currentAssignedAt: Date | null) {
  const studentName = personName(formData, "studentName");
  return {
    studentName,
    referredName: personName(formData, "referredName"),
    enrollmentType: enrollmentType(formData),
    staffName: text(formData, "staffName"),
    enrolledAt: date(formData, "enrolledAt"),
    cardGivenAt: date(formData, "cardGivenAt"),
    duplicateAck: formData.get("duplicateAck") === "on",
    // 最初に塾生を割り当てた日時を STEP3 の入力日時として残す
    assignedAt: studentName ? (currentAssignedAt ?? new Date()) : null,
  };
}
