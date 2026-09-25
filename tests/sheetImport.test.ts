import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { toDateInput } from "@/lib/dates";
import { convertSheet, parseSheetDate, restoreLeadingZero, splitGrade } from "@/lib/sheetImport";

describe("csv", () => {
  it("セル内改行とクォートを往復できる", () => {
    const rows = [["a", 'b "q"', "c\nd"], ["1", "", "x,y"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("sheetImport", () => {
  it("学年と氏名を分ける", () => {
    expect(splitGrade("中３　今野ひなか")).toEqual({ grade: "中3", name: "今野ひなか" });
    expect(splitGrade("中2 朝井たくと")).toEqual({ grade: "中2", name: "朝井たくと" });
    expect(splitGrade("山口　航汰")).toEqual({ grade: "", name: "山口　航汰" });
  });

  it("先頭の0が落ちた電話番号を戻す", () => {
    expect(restoreLeadingZero("9036607242")).toBe("09036607242");
    expect(restoreLeadingZero("956292088")).toBe("0956292088");
    expect(restoreLeadingZero("09059281287")).toBe("09059281287");
  });

  it("年なしの日付は基準年で補う", () => {
    expect(toDateInput(parseSheetDate("2024/07/30/16:02"))).toBe("2024-07-30");
    expect(toDateInput(parseSheetDate("7/15", 2026))).toBe("2026-07-15");
    expect(parseSheetDate("7/15")).toBeNull();
    expect(parseSheetDate("")).toBeNull();
  });

  it("管理表の見出しから列を特定して変換する", () => {
    // 架空データ
    const csv = toCsv([
      [
        "",
        "校舎名",
        "通常or講習会",
        "職員入力\n生徒名",
        "職員入力\n紹介者名（入塾した方）",
        "生徒名",
        "保護者名",
        "メールアドレス",
        "ご住所",
        "電話番号",
        "ご紹介された方の氏名（学年）",
        "Amazon発注済み",
        "送信済み",
        "メール送信日時",
        "入塾日、\n講習申込日",
        "入金日",
        "",
      ],
      ["900001", "日野校", "通常入会", "智翔太郎", "山田次郎", "智翔 太郎", "智翔花子", "p@example.com", "佐世保市1-1", "9012345678", "中2 山田次郎", "TRUE", "", "2026/7/17", "2026/7/3", "7/15", "7/2校舎配布"],
      ["900002", "日宇校", "", "", "", "", "", "", "", "", "", "FALSE", "", "", "", "", ""],
      ["", "日宇校", "", "", "", "", "", "", "", "", "", "FALSE", "", "", "", "", ""],
    ]);
    const rows = convertSheet(parseCsv(csv));
    expect(rows).toHaveLength(2);
    const [a, b] = rows;
    expect(a.code).toBe("900001");
    expect(a.studentName).toBe("智翔太郎");
    expect(a.referredName).toBe("山田次郎");
    expect(a.amazonOrdered).toBe(true);
    expect(toDateInput(a.giftSentAt)).toBe("2026-07-17");
    expect(toDateInput(a.paidAt)).toBe("2026-07-15");
    expect(a.note).toBe("7/2校舎配布");
    expect(a.application).toMatchObject({
      studentName: "智翔 太郎",
      guardianName: "智翔花子",
      phone: "09012345678",
      referredGrade: "中2",
      referredName: "山田次郎",
    });
    expect(b.application).toBeNull();
    expect(b.amazonOrdered).toBe(false);
  });
});

describe("decodeCsv", () => {
  it("UTF-8 と Shift_JIS（Excel 保存）の両方を読める", async () => {
    const { decodeCsv } = await import("@/lib/importSheet");
    const text = "校舎名,生徒名\r\n日野校,智翔 太郎\r\n";
    const utf8 = new TextEncoder().encode(text);
    expect(decodeCsv(utf8.buffer)).toBe(text);
    // 「校舎名,生徒名」の Shift_JIS バイト列
    const sjis = new Uint8Array([0x8d, 0x5a, 0x8e, 0xc9, 0x96, 0xbc, 0x2c, 0x90, 0xb6, 0x93, 0x6b, 0x96, 0xbc]);
    expect(decodeCsv(sjis.buffer)).toBe("校舎名,生徒名");
  });
});
