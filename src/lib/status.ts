// 特典コードの進捗ステータス。
// 管理表の「Amazon発注済み」「メール送信日時」等の列から判断していた状態を、1つの値にまとめる。

export const STATUSES = [
  { key: "unassigned", label: "未割当", tone: "slate" },
  { key: "distributed", label: "申込待ち", tone: "sky" },
  { key: "applied", label: "入塾・入金待ち", tone: "amber" },
  { key: "ready", label: "発注待ち", tone: "rose" },
  { key: "ordered", label: "送付待ち", tone: "violet" },
  { key: "completed", label: "送付完了", tone: "emerald" },
] as const;

export type StatusKey = (typeof STATUSES)[number]["key"];

export type StatusInput = {
  studentName: string | null;
  paidAt: Date | null;
  amazonOrderedAt: Date | null;
  giftSentAt: Date | null;
  applicationCount: number;
};

export function referralStatus(r: StatusInput): StatusKey {
  if (r.giftSentAt) return "completed";
  if (r.amazonOrderedAt) return "ordered";
  if (r.applicationCount > 0 && r.paidAt) return "ready";
  if (r.applicationCount > 0) return "applied";
  // 校舎配布日はカードを校舎へ送った日なので、生徒への割当は生徒名で判断する
  if (r.studentName) return "distributed";
  return "unassigned";
}

export function statusLabel(key: StatusKey): string {
  return STATUSES.find((s) => s.key === key)!.label;
}

export function isStatusKey(value: string | undefined): value is StatusKey {
  return STATUSES.some((s) => s.key === value);
}
