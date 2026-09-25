import "server-only";

// メールは Google Apps Script（GAS）の Web アプリ経由で社用 Gmail から送信する。
// GAS 側のスクリプトは gas/Code.gs。GAS_MAIL_URL 未設定の開発環境では送信せずログに出す。

type Mail = { to: string; subject: string; text: string };

const TIMEOUT_MS = 15_000;

export function isMailConfigured(): boolean {
  return Boolean(process.env.GAS_MAIL_URL && process.env.GAS_MAIL_SECRET);
}

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!isMailConfigured()) {
    console.info(`[mail] GAS_MAIL_URL 未設定のため送信をスキップ: to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return false;
  }
  try {
    // GAS の Web アプリは応答前に script.googleusercontent.com へリダイレクトするため follow する
    const res = await fetch(process.env.GAS_MAIL_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.GAS_MAIL_SECRET, to: mail.to, subject: mail.subject, body: mail.text }),
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (res.ok && result?.ok) return true;
    console.error("[mail] GAS からエラーが返りました", res.status, result?.error ?? "(応答が JSON ではありません)");
    return false;
  } catch (error) {
    console.error("[mail] GAS への送信に失敗しました", error);
    return false;
  }
}
