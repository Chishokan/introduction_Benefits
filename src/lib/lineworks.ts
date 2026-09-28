// LINE WORKS の Incoming Webhook アプリでトークルームへ投稿する。
// POST https://webhook.worksmobile.com/message/… に {"title", "body": {"text"}, "button": {"label", "url"}} を送る。

const TIMEOUT_MS = 10_000;

export type LineWorksMessage = {
  title: string;
  text: string;
  button?: { label: string; url: string };
};

// 設定画面で受け付ける URL（LINE WORKS 以外の宛先に送らないようにする）
export function isLineWorksWebhookUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "webhook.worksmobile.com" && u.pathname.startsWith("/message/");
  } catch {
    return false;
  }
}

export async function sendLineWorks(url: string, message: LineWorksMessage): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: message.title, body: { text: message.text }, ...(message.button ? { button: message.button } : {}) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return true;
    console.error("[lineworks] 送信に失敗しました", res.status, await res.text().catch(() => ""));
    return false;
  } catch (error) {
    console.error("[lineworks] 送信に失敗しました", error);
    return false;
  }
}
