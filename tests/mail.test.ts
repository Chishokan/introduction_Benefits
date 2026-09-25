import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { isMailConfigured, sendMail } from "@/lib/mail";

// GAS の Web アプリと同じく、POST を受けたら別 URL へ 302 リダイレクトし、そこで JSON を返すモック
let server: Server;
let received: Record<string, string>[] = [];
let base = "";

beforeAll(async () => {
  let pending: { ok: boolean; error?: string } = { ok: true };
  server = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/exec") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const data = JSON.parse(body);
        received.push(data);
        pending = data.secret === "s3cret" ? { ok: true } : { ok: false, error: "unauthorized" };
        res.writeHead(302, { Location: "/echo" }).end();
      });
    } else if (req.method === "GET" && req.url === "/echo") {
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(pending));
    } else {
      res.writeHead(404).end("not found");
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server.close());

beforeEach(() => {
  received = [];
  process.env.GAS_MAIL_URL = `${base}/exec`;
  process.env.GAS_MAIL_SECRET = "s3cret";
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

const mail = { to: "p@example.com", subject: "件名", text: "本文" };

describe("sendMail（GAS 経由）", () => {
  it("リダイレクト後の JSON で成功を判定する", async () => {
    expect(await sendMail(mail)).toBe(true);
    expect(received).toEqual([{ secret: "s3cret", to: "p@example.com", subject: "件名", body: "本文" }]);
  });
  it("GAS がエラーを返したら失敗", async () => {
    process.env.GAS_MAIL_SECRET = "wrong";
    expect(await sendMail(mail)).toBe(false);
  });
  it("接続できなければ失敗", async () => {
    process.env.GAS_MAIL_URL = `${base}/missing`;
    expect(await sendMail(mail)).toBe(false);
  });
  it("未設定なら送信しない", async () => {
    delete process.env.GAS_MAIL_URL;
    expect(isMailConfigured()).toBe(false);
    expect(await sendMail(mail)).toBe(false);
    expect(received).toHaveLength(0);
  });
});
