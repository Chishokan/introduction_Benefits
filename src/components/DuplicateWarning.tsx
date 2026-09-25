import Link from "next/link";
import type { DuplicateMatch } from "@/lib/referrals";
import { statusLabel } from "@/lib/status";

// 同じ外部生が過去に特典対象になっている場合の警告（運用マニュアル「７．特典付与制限」）
export function DuplicateWarning({
  duplicates,
  linkBase,
}: {
  duplicates: DuplicateMatch[];
  // 校舎画面では他校舎のコードを開けないため、リンクを付けない
  linkBase?: string;
}) {
  return (
    <div role="alert" className="space-y-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
      <p className="font-semibold">
        紹介特典は「紹介された外部生1名につき1回限り」です。以下のコードで同じ氏名の外部生が登録されています。
      </p>
      <ul className="space-y-1">
        {duplicates.map((d) => (
          <li key={d.id}>
            {linkBase ? (
              <Link href={`${linkBase}/${d.id}`} target="_blank" className="font-mono font-semibold underline">
                {d.code}
              </Link>
            ) : (
              <span className="font-mono font-semibold">{d.code}</span>
            )}
            ：紹介者 {d.studentName ?? "—"} ／ {d.enrollmentType ?? "区分未設定"} ／ {statusLabel(d.status)}
          </li>
        ))}
      </ul>
      <label className="flex items-start gap-2 pt-1 font-semibold">
        <input type="checkbox" name="duplicateAck" className="mt-1 size-4 accent-rose-600" />
        同姓同名の別人であることを確認したので登録する
      </label>
    </div>
  );
}
