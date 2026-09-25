import { describe, expect, it } from "vitest";
import { normalizeCode, normalizePhone, sameName } from "@/lib/normalize";
import { applicationSchema, firstErrors } from "@/lib/validation";

const valid = {
  campusId: "1",
  studentName: " 智翔　太郎 ",
  guardianName: "智翔 花子",
  email: "parent@example.com",
  emailConfirm: "Parent@example.com",
  address: "佐世保市〇〇町1-2-3",
  phone: "090-1234-5678",
  referredGrade: "中2",
  referredName: "智翔館 次郎",
  code: "１０９１３５",
  agree: "on",
};

describe("applicationSchema", () => {
  it("正しい入力を正規化して受け付ける", () => {
    const r = applicationSchema.parse(valid);
    expect(r.code).toBe("109135");
    expect(r.phone).toBe("09012345678");
    expect(r.studentName).toBe("智翔 太郎");
    expect(r.campusId).toBe(1);
  });

  it("未入力・不一致をフィールドごとに返す", () => {
    const r = applicationSchema.safeParse({
      ...valid,
      guardianName: "",
      emailConfirm: "other@example.com",
      phone: "12345",
      referredGrade: "",
      agree: "",
    });
    expect(r.success).toBe(false);
    const e = firstErrors(r.error!);
    expect(Object.keys(e).sort()).toEqual(["agree", "emailConfirm", "guardianName", "phone", "referredGrade"]);
  });

  it("コードは数字のみ", () => {
    expect(applicationSchema.safeParse({ ...valid, code: "abc123" }).success).toBe(false);
  });
});

describe("normalize", () => {
  it("全角数字・ハイフンを吸収する", () => {
    expect(normalizeCode(" １０９-１３５ ")).toBe("109135");
    expect(normalizePhone("０９０ー１２３４ー５６７８")).toBe("09012345678");
  });
  it("氏名は空白と異体字を無視して比較する", () => {
    expect(sameName("庄﨑あかね", "庄崎 あかね")).toBe(true);
    expect(sameName("久保　琉乙", "久保琉乙")).toBe(true);
    expect(sameName("山口航汰", "岡優真")).toBe(false);
    expect(sameName(null, "a")).toBe(false);
  });
});
