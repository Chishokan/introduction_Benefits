import "server-only";
import nodemailer from "nodemailer";

// SMTP（Gmail のアプリパスワード等）で送信する。
// SMTP_HOST 未設定の開発環境では送信せずログに出す。

type Mail = { to: string; subject: string; text: string };

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!isMailConfigured()) {
    console.info(`[mail] SMTP 未設定のため送信をスキップ: to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return false;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  try {
    await transport.sendMail({ from: process.env.MAIL_FROM, ...mail });
    return true;
  } catch (error) {
    console.error("[mail] 送信に失敗しました", error);
    return false;
  }
}
