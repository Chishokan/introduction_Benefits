import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isLineWorksWebhookUrl, sendLineWorks } from "@/lib/lineworks";
import { buildNoApplyMessage } from "@/lib/noApplyNotice";
import { needsNoApplyNotice } from "@/lib/rules";

const jst = (s: string) => new Date(`${s}+09:00`);
const now = jst("2026-09-28T09:00:00");
const base = {
  studentName: "塾生",
  assignedAt: jst("2026-09-21T08:00:00"),
  giftSentAt: null,
  noApplyNotifiedAt: null,
  applicationCount: 0,
};

describe("needsNoApplyNotice（職員入力から1週間・保護者申込みなし）", () => {
  it("7日経過・申込みなし・未通知なら通知する", () => {
    expect(needsNoApplyNotice(base, now)).toBe(true);
  });
  it("7日未満・申込みあり・通知済み・塾生未入力・送付済みは通知しない", () => {
    expect(needsNoApplyNotice({ ...base, assignedAt: jst("2026-09-21T10:00:00") }, now)).toBe(false);
    expect(needsNoApplyNotice({ ...base, applicationCount: 1 }, now)).toBe(false);
    expect(needsNoApplyNotice({ ...base, noApplyNotifiedAt: now }, now)).toBe(false);
    expect(needsNoApplyNotice({ ...base, studentName: null }, now)).toBe(false);
    expect(needsNoApplyNotice({ ...base, assignedAt: null }, now)).toBe(false);
    expect(needsNoApplyNotice({ ...base, giftSentAt: now }, now)).toBe(false);
  });
});

describe("LINE WORKS", () => {
  it("Webhook URL は LINE WORKS のものだけ受け付ける", () => {
    expect(isLineWorksWebhookUrl("https://webhook.worksmobile.com/message/657eab7c-bb8b-4a3f-bd74-a41f1c8cf7c9")).toBe(true);
    expect(isLineWorksWebhookUrl("http://webhook.worksmobile.com/message/x")).toBe(false);
    expect(isLineWorksWebhookUrl("https://example.com/message/x")).toBe(false);
    expect(isLineWorksWebhookUrl("https://webhook.worksmobile.com.evil.example/message/x")).toBe(false);
    expect(isLineWorksWebhookUrl("not a url")).toBe(false);
  });

  it("校舎ごとの通知文を作る", () => {
    const m = buildNoApplyMessage(
      "日野校",
      [{ code: "109135", studentName: "智翔 太郎", referredName: "山田 次郎", assignedAt: jst("2026-09-20T10:00:00"), cardGivenAt: jst("2026-09-20T00:00:00") }],
      "https://example.vercel.app",
    );
    expect(m.title).toBe("【紹介特典】保護者の申込みがありません（日野校）");
    expect(m.text).toContain("1 件");
    expect(m.text).toContain("・109135 塾生 智翔 太郎 → 紹介 山田 次郎（職員入力 2026/09/20・入力期限 2026/10/20）");
    expect(m.button).toEqual({ label: "状況を確認する", url: "https://example.vercel.app/campus?flag=noApplyWeek" });
  });

  it("21件以上は省略する", () => {
    const items = Array.from({ length: 23 }, (_, i) => ({
      code: String(100000 + i),
      studentName: "a",
      referredName: "b",
      assignedAt: now,
      cardGivenAt: null,
    }));
    const m = buildNoApplyMessage("日野校", items, undefined);
    expect(m.text).toContain("ほか 3 件");
    expect(m.button).toBeUndefined();
  });

  describe("sendLineWorks", () => {
    let server: Server;
    let url = "";
    const received: unknown[] = [];
    beforeAll(async () => {
      server = createServer((req, res) => {
        let b = "";
        req.on("data", (c) => (b += c));
        req.on("end", () => {
          if (req.url === "/message/ok") {
            received.push({ contentType: req.headers["content-type"], body: JSON.parse(b) });
            res.writeHead(200).end();
          } else res.writeHead(400).end("bad");
        });
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterAll(() => server.close());

    it("title / body.text / button の形式で POST する", async () => {
      expect(await sendLineWorks(`${url}/message/ok`, { title: "T", text: "本文", button: { label: "L", url: "https://x" } })).toBe(true);
      expect(received).toEqual([
        { contentType: "application/json", body: { title: "T", body: { text: "本文" }, button: { label: "L", url: "https://x" } } },
      ]);
    });
    it("エラー応答なら失敗", async () => {
      expect(await sendLineWorks(`${url}/message/ng`, { title: "T", text: "x" })).toBe(false);
    });
  });
});
