import { describe, expect, it } from "vitest";
import { campusSummaries, countInWindow, flattenApplications, monthlyCounts } from "@/lib/dashboard";

const jst = (s: string) => new Date(`${s}+09:00`);
const now = jst("2026-09-25T12:00:00");

const app = (id: number, at: string, extra: Partial<{ late: boolean; confirmedAt: Date }> = {}) => ({
  id,
  createdAt: jst(at),
  confirmedAt: extra.confirmedAt ?? null,
  late: extra.late ?? false,
  exceptionAt: null,
  guardianName: "保護者",
  studentName: "塾生",
  referredGrade: "中2",
  referredName: "外部生",
});

const rows = [
  {
    id: 1,
    code: "100001",
    campusId: 1,
    campus: { name: "日野校" },
    status: "applied" as const,
    flags: { late: false, mismatch: true },
    applications: [app(1, "2026-09-24T10:00:00"), app(2, "2026-09-10T10:00:00")],
  },
  {
    id: 2,
    code: "100002",
    campusId: 2,
    campus: { name: "日宇校" },
    status: "expired" as const,
    flags: { late: true },
    applications: [app(3, "2026-09-20T10:00:00", { late: true })],
  },
  { id: 3, code: "100003", campusId: 1, campus: { name: "日野校" }, status: "distributed" as const, flags: {}, applications: [] },
];

describe("dashboard", () => {
  it("申込みを新しい順に並べ、有効かどうかを付ける", () => {
    const list = flattenApplications(rows);
    expect(list.map((a) => a.id)).toEqual([1, 3, 2]);
    expect(list.find((a) => a.id === 3)?.valid).toBe(false);
    expect(list[0].referral).toMatchObject({ code: "100001", campusName: "日野校" });
  });

  it("直近7日と前の7日を数える", () => {
    const dates = [jst("2026-09-24T00:00:00"), jst("2026-09-19T00:00:00"), jst("2026-09-15T00:00:00"), jst("2026-09-01T00:00:00")];
    expect(countInWindow(dates, 7, now)).toEqual({ current: 2, previous: 1 });
  });

  it("月別件数は日本時間の月で数え、件数ゼロの月も並べる", () => {
    const dates = [jst("2026-09-01T00:30:00"), jst("2026-08-31T23:30:00"), jst("2026-07-15T00:00:00"), jst("2025-01-01T00:00:00")];
    const m = monthlyCounts(dates, 3, now);
    expect(m).toEqual([
      { month: "2026-07", label: "7月", count: 1 },
      { month: "2026-08", label: "8月", count: 1 },
      { month: "2026-09", label: "9月", count: 1 },
    ]);
    expect(monthlyCounts([], 12, now)[0].month).toBe("2025-10");
  });

  it("校舎別に状態・要対応・直近の申込みを集計する", () => {
    const s = campusSummaries(rows, now);
    const hino = s.find((c) => c.name === "日野校")!;
    expect(hino.byStatus.applied).toBe(1);
    expect(hino.byStatus.distributed).toBe(1);
    expect(hino.issues).toBe(1);
    expect(hino.newApplications).toBe(1);
    expect(s.find((c) => c.name === "日宇校")!.issues).toBe(1);
  });
});
