import { personKey } from "./rules";

// 保護者入力の表記ゆれ（全角数字・全角ハイフン・前後空白）を吸収する。

export function toHalfWidth(value: string): string {
  return value
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[‐－―−ー ｰ]/g, "-")
    .replace(/　/g, " ");
}

export function normalizeCode(value: string): string {
  return toHalfWidth(value).replace(/[\s-]/g, "");
}

export function normalizePhone(value: string): string {
  return toHalfWidth(value).replace(/[\s()（）-]/g, "");
}

export function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// 職員入力の「紹介された方」と保護者入力の氏名を、空白の有無を無視して比較する
export function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = personKey(a);
  return ka !== null && ka === personKey(b);
}
