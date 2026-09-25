import { describe, expect, it } from "vitest";
import { toDateInput } from "@/lib/dates";
import {
  isAfterQrDeadline,
  isStaffInputDelayed,
  isValidApplication,
  personKey,
  qrDeadlineDate,
  staffInputDeadlineDate,
} from "@/lib/rules";

const jst = (s: string) => new Date(`${s}+09:00`);

describe("QR 入力期限（カード配布から1か月）", () => {
  it("期限日は翌月の同日", () => {
    expect(toDateInput(qrDeadlineDate(jst("2026-07-02T00:00:00")))).toBe("2026-08-02");
    expect(toDateInput(qrDeadlineDate(jst("2026-12-15T00:00:00")))).toBe("2027-01-15");
  });
  it("翌月に同日がなければ月末", () => {
    expect(toDateInput(qrDeadlineDate(jst("2026-01-31T00:00:00")))).toBe("2026-02-28");
    expect(toDateInput(qrDeadlineDate(jst("2028-01-31T00:00:00")))).toBe("2028-02-29");
  });
  it("期限日の終わりまでは有効", () => {
    const given = jst("2026-07-02T00:00:00");
    expect(isAfterQrDeadline(given, jst("2026-08-02T23:59:59"))).toBe(false);
    expect(isAfterQrDeadline(given, jst("2026-08-03T00:00:00"))).toBe(true);
  });
  it("カード配布日が未入力なら期限なし", () => {
    expect(isAfterQrDeadline(null, jst("2030-01-01T00:00:00"))).toBe(false);
  });
});

describe("職員入力期限（STEP2 から3日以内）", () => {
  const enrolled = jst("2026-07-01T00:00:00");
  it("期限日は3日後", () => {
    expect(toDateInput(staffInputDeadlineDate(enrolled))).toBe("2026-07-04");
  });
  it("3日以内の入力は遅延なし、超えたら遅延", () => {
    expect(isStaffInputDelayed(enrolled, jst("2026-07-04T20:00:00"), new Date())).toBe(false);
    expect(isStaffInputDelayed(enrolled, jst("2026-07-05T09:00:00"), new Date())).toBe(true);
  });
  it("未入力のまま期限を過ぎたら遅延", () => {
    expect(isStaffInputDelayed(enrolled, null, jst("2026-07-03T00:00:00"))).toBe(false);
    expect(isStaffInputDelayed(enrolled, null, jst("2026-07-06T00:00:00"))).toBe(true);
  });
  it("入塾・申込日が未入力なら判定しない", () => {
    expect(isStaffInputDelayed(null, null, new Date())).toBe(false);
  });
});

describe("申請の有効性・外部生の同一判定", () => {
  it("期限超過は特例承認されたものだけ有効", () => {
    expect(isValidApplication({ late: false, exceptionAt: null })).toBe(true);
    expect(isValidApplication({ late: true, exceptionAt: null })).toBe(false);
    expect(isValidApplication({ late: true, exceptionAt: new Date() })).toBe(true);
  });
  it("空白・異体字を無視して同一人物とみなす", () => {
    expect(personKey("髙橋　花子")).toBe(personKey("高橋花子"));
    expect(personKey("  ")).toBeNull();
    expect(personKey(null)).toBeNull();
  });
});

describe("期限切れ通知メール", () => {
  it("コード・期限・問い合わせ先を含む", async () => {
    const { expiryNoticeMail } = await import("@/lib/mailTemplates");
    const m = expiryNoticeMail({
      guardianName: "智翔 花子",
      code: "109135",
      campusName: "日野校",
      deadline: jst("2026-08-02T00:00:00"),
    });
    expect(m.subject).toContain("入力期限切れ");
    expect(m.text).toContain("智翔 花子 様");
    expect(m.text).toContain("109135");
    expect(m.text).toContain("2026/08/02");
    expect(m.text).toContain("日野校");
  });
});
