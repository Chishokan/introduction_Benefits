import { setApplyErrorResolved } from "@/app/login/actions";
import { formatDateTime } from "@/lib/dates";
import { APPLY_ERROR_REASONS } from "@/lib/referrals";

type ApplyErrorRow = {
  id: number;
  code: string;
  reason: string;
  studentName: string;
  guardianName: string;
  email: string;
  phone: string;
  resolvedAt: Date | null;
  createdAt: Date;
  campus: { name: string } | null;
};

// 保護者の申込みが受け付けられなかった記録。校舎から保護者へ連絡し、対応済みにする
export function ApplyErrorList({ errors, showCampus }: { errors: ApplyErrorRow[]; showCampus?: boolean }) {
  if (errors.length === 0) {
    return <div className="card p-6 text-center text-sm text-slate-400">申込みエラーはありません</div>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">日時</th>
            {showCampus && <th className="px-3 py-2">校舎</th>}
            <th className="px-3 py-2">入力されたコード</th>
            <th className="px-3 py-2">内容</th>
            <th className="px-3 py-2">生徒名 / 保護者名</th>
            <th className="px-3 py-2">連絡先</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {errors.map((e) => (
            <tr key={e.id} className={e.resolvedAt ? "text-slate-400" : ""}>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDateTime(e.createdAt)}</td>
              {showCampus && <td className="whitespace-nowrap px-3 py-2">{e.campus?.name}</td>}
              <td className="px-3 py-2 font-mono">{e.code}</td>
              <td className="px-3 py-2">{APPLY_ERROR_REASONS[e.reason] ?? e.reason}</td>
              <td className="px-3 py-2">
                {e.studentName} / {e.guardianName}
              </td>
              <td className="px-3 py-2 text-xs">
                <div className="break-all">{e.email}</div>
                <div className="tabular-nums">{e.phone}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <form action={setApplyErrorResolved.bind(null, e.id, !e.resolvedAt)}>
                  {e.resolvedAt ? (
                    <button type="submit" className="text-xs underline">
                      対応済み {formatDateTime(e.resolvedAt)}（取消）
                    </button>
                  ) : (
                    <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                      対応済みにする
                    </button>
                  )}
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
