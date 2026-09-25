// ダッシュボードの集計。特典コード一覧（状態・要対応フラグ付き）から計算する純粋関数。

import { toDateInput } from "./dates";
import { isValidApplication } from "./rules";
import type { StatusKey } from "./status";

type AppLike = {
  id: number;
  createdAt: Date;
  confirmedAt: Date | null;
  late: boolean;
  exceptionAt: Date | null;
  guardianName: string;
  studentName: string;
  referredGrade: string;
  referredName: string;
};

type ReferralLike = {
  id: number;
  code: string;
  campusId: number;
  campus: { name: string };
  status: StatusKey;
  flags: Record<string, boolean | undefined>;
  applications: AppLike[];
};

export type RecentApplication = AppLike & {
  valid: boolean;
  referral: { id: number; code: string; campusName: string; status: StatusKey };
};

const DAY = 86_400_000;

export function flattenApplications(rows: ReferralLike[]): RecentApplication[] {
  return rows
    .flatMap((r) =>
      r.applications.map((a) => ({
        ...a,
        valid: isValidApplication(a),
        referral: { id: r.id, code: r.code, campusName: r.campus.name, status: r.status },
      })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 直近 days 日と、その前の同じ日数の件数（前期間比の表示用）
export function countInWindow(dates: Date[], days: number, now: Date): { current: number; previous: number } {
  const t = now.getTime();
  let current = 0;
  let previous = 0;
  for (const d of dates) {
    const age = t - d.getTime();
    if (age < 0) continue;
    if (age < days * DAY) current++;
    else if (age < 2 * days * DAY) previous++;
  }
  return { current, previous };
}

// 直近 months か月（今月を含む）の月別件数。月は日本時間で区切る
export function monthlyCounts(dates: Date[], months: number, now: Date): { month: string; label: string; count: number }[] {
  const [y, m] = toDateInput(now).split("-").map(Number);
  const buckets: { month: string; label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({ month: key, label: `${d.getUTCMonth() + 1}月`, count: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.month, i]));
  for (const d of dates) {
    const i = index.get(toDateInput(d).slice(0, 7));
    if (i !== undefined) buckets[i].count++;
  }
  return buckets;
}

export type CampusSummary = {
  campusId: number;
  name: string;
  newApplications: number; // 直近7日の申込み
  byStatus: Record<StatusKey, number>;
  issues: number; // 要対応のあるコード数
};

const EMPTY_STATUS: Record<StatusKey, number> = {
  unassigned: 0,
  distributed: 0,
  expired: 0,
  applied: 0,
  ready: 0,
  ordered: 0,
  completed: 0,
};

export function campusSummaries(rows: ReferralLike[], now: Date): CampusSummary[] {
  const map = new Map<number, CampusSummary>();
  for (const r of rows) {
    let s = map.get(r.campusId);
    if (!s) {
      s = { campusId: r.campusId, name: r.campus.name, newApplications: 0, byStatus: { ...EMPTY_STATUS }, issues: 0 };
      map.set(r.campusId, s);
    }
    s.byStatus[r.status]++;
    if (Object.values(r.flags).some(Boolean)) s.issues++;
    s.newApplications += countInWindow(
      r.applications.map((a) => a.createdAt),
      7,
      now,
    ).current;
  }
  return [...map.values()];
}
