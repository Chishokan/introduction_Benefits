import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { normalizeCode } from "@/lib/normalize";
import { ApplicationForm } from "./ApplicationForm";
import { ApplyHeader } from "./Header";

export const metadata: Metadata = { title: "紹介特典のお申込み | 智翔館" };

export default async function ApplyPage({ searchParams }: PageProps<"/apply">) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? normalizeCode(code) : "";

  const [campuses, referral] = await Promise.all([
    prisma.campus.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    initialCode
      ? prisma.referral.findUnique({ where: { code: initialCode }, select: { campusId: true } })
      : null,
  ]);

  return (
    <>
      <ApplyHeader />
      <main className="mx-auto -mt-6 w-full max-w-xl flex-1 px-4 pb-16">
        <ApplicationForm
          campuses={campuses}
          initialCode={initialCode}
          initialCampusId={referral?.campusId ?? null}
        />
      </main>
    </>
  );
}
