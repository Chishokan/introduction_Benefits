// 日付は日本時間の「日」単位で扱う。
// <input type="date"> の "YYYY-MM-DD" を JST 0:00 として保存し、表示も JST で行う。

const TZ = "Asia/Tokyo";

export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parts(date: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(date); // YYYY-MM-DD
}

export function toDateInput(date: Date | null | undefined): string {
  return date ? parts(date) : "";
}

export function formatDate(date: Date | null | undefined): string {
  return date ? parts(date).replaceAll("-", "/") : "";
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  const f = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return f.format(date);
}

export function todayInput(): string {
  return parts(new Date());
}
