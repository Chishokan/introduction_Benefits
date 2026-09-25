import { describe, expect, it } from "vitest";
import { referralStatus, type StatusInput } from "@/lib/status";

const base: StatusInput = {
  studentName: null,
  paidAt: null,
  amazonOrderedAt: null,
  giftSentAt: null,
  applicationCount: 0,
};
const d = new Date("2026-07-01T00:00:00+09:00");

describe("referralStatus", () => {
  it("生徒未割当なら未割当", () => {
    expect(referralStatus(base)).toBe("unassigned");
  });
  it("生徒を割り当てたら申込待ち", () => {
    expect(referralStatus({ ...base, studentName: "智翔 太郎" })).toBe("distributed");
  });
  it("保護者申込があれば入塾・入金待ち", () => {
    expect(referralStatus({ ...base, applicationCount: 1 })).toBe("applied");
  });
  it("入金があっても申込がなければ発注しない", () => {
    expect(referralStatus({ ...base, studentName: "a", paidAt: d })).toBe("distributed");
  });
  it("申込と入金がそろえば発注待ち", () => {
    expect(referralStatus({ ...base, applicationCount: 1, paidAt: d })).toBe("ready");
  });
  it("発注済み→送付待ち、送付日があれば完了", () => {
    expect(referralStatus({ ...base, applicationCount: 1, paidAt: d, amazonOrderedAt: d })).toBe("ordered");
    expect(referralStatus({ ...base, applicationCount: 1, paidAt: d, amazonOrderedAt: d, giftSentAt: d })).toBe(
      "completed",
    );
  });
});
