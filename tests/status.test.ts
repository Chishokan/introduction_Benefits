import { describe, expect, it } from "vitest";
import { referralStatus, type StatusInput } from "@/lib/status";

const base: StatusInput = {
  studentName: null,
  cardGivenAt: null,
  paidAt: null,
  amazonOrderedAt: null,
  giftSentAt: null,
  validApplicationCount: 0,
};
const d = new Date("2026-07-01T00:00:00+09:00");
const now = new Date("2026-07-20T12:00:00+09:00");

describe("referralStatus", () => {
  it("生徒未割当なら未割当", () => {
    expect(referralStatus(base, now)).toBe("unassigned");
  });
  it("生徒を割り当てたら申込待ち", () => {
    expect(referralStatus({ ...base, studentName: "智翔 太郎" }, now)).toBe("distributed");
    expect(referralStatus({ ...base, studentName: "智翔 太郎", cardGivenAt: d }, now)).toBe("distributed");
  });
  it("カード配布から1か月を過ぎて申込がなければ期限切れ", () => {
    const later = new Date("2026-08-02T00:00:00+09:00");
    expect(referralStatus({ ...base, studentName: "a", cardGivenAt: d }, later)).toBe("expired");
  });
  it("有効な保護者申込があれば入塾・入金待ち", () => {
    expect(referralStatus({ ...base, validApplicationCount: 1 }, now)).toBe("applied");
  });
  it("入金があっても申込がなければ発注しない", () => {
    expect(referralStatus({ ...base, studentName: "a", paidAt: d }, now)).toBe("distributed");
  });
  it("申込と入金がそろえば発注待ち", () => {
    expect(referralStatus({ ...base, validApplicationCount: 1, paidAt: d }, now)).toBe("ready");
  });
  it("発注済み→送付待ち、送付日があれば完了", () => {
    expect(referralStatus({ ...base, validApplicationCount: 1, paidAt: d, amazonOrderedAt: d }, now)).toBe("ordered");
    expect(
      referralStatus({ ...base, validApplicationCount: 1, paidAt: d, amazonOrderedAt: d, giftSentAt: d }, now),
    ).toBe("completed");
  });
});
