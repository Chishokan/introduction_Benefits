// 運用マニュアル（中等部 紹介特典制度）のルールをまとめる。
// - STEP3: 入塾・講習申込（STEP2）から3日以内に職員が特典管理へ入力する
// - STEP5: 保護者の QR 入力はカード配布から1か月以内。過ぎた申請は無効（特例承認を除く）
// - 紹介された外部生1名につき特典は1回のみ

import { toDateInput } from "./dates";

export const STAFF_INPUT_DAYS = 3;
export const QR_DEADLINE_MONTHS = 1;

// JST の日付 (YYYY-MM-DD) を年月日に分解
function ymd(date: Date): [number, number, number] {
  const [y, m, d] = toDateInput(date).split("-").map(Number);
  return [y, m, d];
}

function jstMidnight(y: number, m: number, d: number): Date {
  // Date.UTC は月・日のあふれを繰り上げてくれる
  const utc = new Date(Date.UTC(y, m - 1, d));
  return new Date(utc.getTime() - 9 * 60 * 60 * 1000);
}

// 期限日（この日の終わりまで有効）
export function qrDeadlineDate(cardGivenAt: Date): Date {
  const [y, m, d] = ymd(cardGivenAt);
  const lastDay = new Date(Date.UTC(y, m - 1 + QR_DEADLINE_MONTHS + 1, 0)).getUTCDate();
  return jstMidnight(y, m + QR_DEADLINE_MONTHS, Math.min(d, lastDay));
}

function endOfDay(day: Date): Date {
  const [y, m, d] = ymd(day);
  return jstMidnight(y, m, d + 1);
}

export function isAfterQrDeadline(cardGivenAt: Date | null, at: Date): boolean {
  return cardGivenAt !== null && at >= endOfDay(qrDeadlineDate(cardGivenAt));
}

export function staffInputDeadlineDate(enrolledAt: Date): Date {
  const [y, m, d] = ymd(enrolledAt);
  return jstMidnight(y, m, d + STAFF_INPUT_DAYS);
}

// 入塾・講習申込日から3日を過ぎて職員入力された（またはまだ入力されていない）
export function isStaffInputDelayed(enrolledAt: Date | null, assignedAt: Date | null, now: Date): boolean {
  if (!enrolledAt) return false;
  return (assignedAt ?? now) >= endOfDay(staffInputDeadlineDate(enrolledAt));
}

export type ApplicationValidity = { late: boolean; exceptionAt: Date | null };

// 期限超過の申請は特例承認されたものだけ有効
export function isValidApplication(a: ApplicationValidity): boolean {
  return !a.late || a.exceptionAt !== null;
}

// 外部生の同一人物判定用キー（空白・異体字を無視）
export function personKey(name: string | null | undefined): string | null {
  if (!name) return null;
  const k = name.replace(/[\s　]/g, "").replace(/﨑/g, "崎").replace(/髙/g, "高");
  return k || null;
}
