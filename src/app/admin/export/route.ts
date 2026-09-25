import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { formatDate, formatDateTime } from "@/lib/dates";
import { FLAGS, isFlagKey, listReferrals } from "@/lib/referrals";
import { isStatusKey, statusLabel } from "@/lib/status";

// 一覧画面の絞り込み条件のまま、管理表と同じ並びの CSV を出力する
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "accounting") return new Response("Unauthorized", { status: 401 });

  const sp = new URL(request.url).searchParams;
  const status = sp.get("status") ?? undefined;
  const flag = sp.get("flag") ?? undefined;
  const rows = (
    await listReferrals({ campusId: Number(sp.get("campus")) || undefined, q: sp.get("q") ?? undefined })
  )
    .filter((r) => !isStatusKey(status) || r.status === status)
    .filter((r) => !isFlagKey(flag) || r.flags[flag]);

  const header = [
    "コード",
    "校舎名",
    "区分",
    "職員入力 生徒名",
    "職員入力 紹介された方",
    "担当者",
    "校舎配布日",
    "入塾日・講習申込日",
    "職員入力日時",
    "カード配布日",
    "申込日時",
    "生徒名",
    "保護者名",
    "メールアドレス",
    "ご住所",
    "電話番号",
    "ご紹介した方",
    "申込件数",
    "入金日",
    "Amazon発注日",
    "ギフトコード",
    "送付日",
    "状態",
    "要対応",
    "備考",
  ];
  const body = rows.map((r) => {
    const a = r.applications[0];
    return [
      r.code,
      r.campus.name,
      r.enrollmentType,
      r.studentName,
      r.referredName,
      r.staffName,
      formatDate(r.distributedAt),
      formatDate(r.enrolledAt),
      formatDateTime(r.assignedAt),
      formatDate(r.cardGivenAt),
      formatDateTime(a?.createdAt),
      a?.studentName,
      a?.guardianName,
      a?.email,
      a?.address,
      a?.phone,
      a ? `${a.referredGrade} ${a.referredName}` : "",
      r.applications.length,
      formatDate(r.paidAt),
      formatDate(r.amazonOrderedAt),
      r.giftCode,
      formatDate(r.giftSentAt),
      statusLabel(r.status),
      FLAGS.filter((f) => r.flags[f.key]).map((f) => f.label).join(" / "),
      r.note,
    ];
  });

  const stamp = formatDate(new Date()).replaceAll("/", "");
  return new Response(toCsv([header, ...body]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="referrals-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
