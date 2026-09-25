import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCampus } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCode } from "@/lib/normalize";

// コード番号から特典コードを開く
export default async function FindPage({ searchParams }: PageProps<"/campus/find">) {
  const campusId = await requireCampus();
  const { code } = await searchParams;
  const normalized = typeof code === "string" ? normalizeCode(code) : "";
  const referral = normalized
    ? await prisma.referral.findUnique({ where: { code: normalized }, include: { campus: true } })
    : null;
  if (referral && referral.campusId === campusId) redirect(`/campus/referrals/${referral.id}`);

  return (
    <div className="card max-w-lg space-y-3 p-6 text-sm">
      <h1 className="font-mono text-lg font-bold">{normalized || "（未入力）"}</h1>
      {referral ? (
        <p className="text-rose-700">このコードは {referral.campus.name} のコードです。コード番号をご確認ください。</p>
      ) : (
        <p className="text-rose-700">
          このコードは登録されていません。カードのコード番号を確認し、正しい場合は経理へ登録を依頼してください。
        </p>
      )}
      <Link href="/campus" className="btn-secondary">
        戻る
      </Link>
    </div>
  );
}
