// スプレッドシート「管理表」を CSV で書き出したものを、アプリのデータ形式に変換する。
// 列の位置はシートごとに異なるため、見出しの文字列で列を特定する。

import { GRADES } from "./constants";
import { normalizeCode, normalizePhone, toHalfWidth } from "./normalize";

export type SheetRow = {
  code: string;
  campus: string;
  enrollmentType: string | null;
  studentName: string | null;
  referredName: string | null;
  enrolledAt: Date | null;
  paidAt: Date | null;
  amazonOrdered: boolean;
  giftSentAt: Date | null;
  note: string | null;
  application: {
    studentName: string;
    guardianName: string;
    email: string;
    address: string;
    phone: string;
    referredGrade: string;
    referredName: string;
  } | null;
};

const HEADERS = {
  campus: "校舎名",
  enrollmentType: "通常or講習会",
  staffStudent: "職員入力生徒名",
  staffReferred: "職員入力紹介者名",
  student: "生徒名",
  guardian: "保護者名",
  email: "メールアドレス",
  address: "ご住所",
  phone: "電話番号",
  referred: "ご紹介された方",
  ordered: "Amazon発注済み",
  sentAt: "メール送信日時",
  enrolledAt: "入塾日",
  paidAt: "入金日",
} as const;

type Key = keyof typeof HEADERS;

const squash = (s: string) => s.replace(/\s/g, "");

export function mapHeader(header: string[]): Partial<Record<Key, number>> {
  const cols = header.map(squash);
  const out: Partial<Record<Key, number>> = {};
  for (const [key, label] of Object.entries(HEADERS) as [Key, string][]) {
    // 「生徒名」は「職員入力生徒名」と区別するため完全一致で探す
    const exact = key === "student" || key === "guardian";
    const i = cols.findIndex((c) => (exact ? c === label : c.startsWith(label)));
    if (i >= 0) out[key] = i;
  }
  return out;
}

// "2026/7/3" "2024/07/30/16:02" "7/15"（年なし）を解釈する。年なしは fallbackYear を使う。
export function parseSheetDate(value: string | undefined, fallbackYear?: number): Date | null {
  const v = toHalfWidth(value ?? "").trim();
  let m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(v);
  if (m) return jst(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})\/(\d{1,2})$/.exec(v);
  if (m && fallbackYear) return jst(fallbackYear, +m[1], +m[2]);
  return null;
}

function jst(y: number, mo: number, d: number): Date {
  return new Date(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+09:00`);
}

// スプレッドシートで数値扱いされ先頭の 0 が落ちた電話番号を戻す（9036607242 → 09036607242）
export function restoreLeadingZero(phone: string): string {
  return /^[1-9]\d{8,9}$/.test(phone) ? `0${phone}` : phone;
}

// "中３　今野ひなか" → { grade: "中3", name: "今野ひなか" }
export function splitGrade(value: string): { grade: string; name: string } {
  const v = value.trim();
  const m = /^([小中高])\s*([1-6１-６])\s*(.*)$/.exec(v);
  if (m) {
    const grade = `${m[1]}${toHalfWidth(m[2])}`;
    if ((GRADES as readonly string[]).includes(grade)) return { grade, name: m[3].trim() || v };
  }
  return { grade: "", name: v };
}

export function convertSheet(rows: string[][]): SheetRow[] {
  const headerIndex = rows.findIndex((r) => r.some((c) => squash(c) === HEADERS.campus));
  if (headerIndex < 0) throw new Error("見出し行（校舎名）が見つかりません");
  const header = rows[headerIndex];
  const col = mapHeader(header);
  const known = new Set(Object.values(col));
  const get = (r: string[], k: Key) => (col[k] === undefined ? "" : (r[col[k]!] ?? "").trim());

  const out: SheetRow[] = [];
  for (const r of rows.slice(headerIndex + 1)) {
    const code = normalizeCode(r[0] ?? "");
    if (!/^\d{4,10}$/.test(code)) continue;

    const enrolledAt = parseSheetDate(get(r, "enrolledAt"));
    const giftSentAt = parseSheetDate(get(r, "sentAt"));
    const year = (enrolledAt ?? giftSentAt)?.getFullYear();
    const email = get(r, "email");
    const referred = splitGrade(get(r, "referred"));
    // 見出しのない列や未対応の列（配布メモ・入退塾メモ等）は備考にまとめる
    const extras = r
      .map((c, i) => ({ c: c.trim(), i }))
      .filter(({ c, i }) => i > 0 && c && !known.has(i) && c !== "FALSE" && c !== "TRUE")
      .map(({ c, i }) => (squash(header[i] ?? "") ? `${squash(header[i])}: ${c}` : c));

    out.push({
      code,
      campus: get(r, "campus"),
      enrollmentType: get(r, "enrollmentType") || null,
      studentName: get(r, "staffStudent") || null,
      referredName: get(r, "staffReferred") || null,
      enrolledAt,
      paidAt: parseSheetDate(get(r, "paidAt"), year),
      amazonOrdered: get(r, "ordered").toUpperCase() === "TRUE",
      giftSentAt,
      note: extras.length ? extras.join(" / ") : null,
      application: email
        ? {
            studentName: get(r, "student"),
            guardianName: get(r, "guardian"),
            email,
            address: get(r, "address"),
            phone: restoreLeadingZero(normalizePhone(get(r, "phone"))),
            referredGrade: referred.grade,
            referredName: referred.name,
          }
        : null,
    });
  }
  return out;
}
