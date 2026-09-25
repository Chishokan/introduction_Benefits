import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { referralStatus, type StatusKey } from "./status";

export type ReferralFilter = {
  campusId?: number;
  q?: string;
};

const listInclude = {
  campus: true,
  applications: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.ReferralInclude;

export type ReferralRow = Prisma.ReferralGetPayload<{ include: typeof listInclude }> & {
  status: StatusKey;
};

export async function listReferrals(filter: ReferralFilter = {}): Promise<ReferralRow[]> {
  const q = filter.q?.trim();
  const where: Prisma.ReferralWhereInput = {
    ...(filter.campusId ? { campusId: filter.campusId } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q } },
            { studentName: { contains: q } },
            { referredName: { contains: q } },
            { staffName: { contains: q } },
            {
              applications: {
                some: {
                  OR: [
                    { studentName: { contains: q } },
                    { guardianName: { contains: q } },
                    { email: { contains: q } },
                    { referredName: { contains: q } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
  const rows = await prisma.referral.findMany({
    where,
    include: listInclude,
    orderBy: { code: "desc" },
  });
  return rows.map((r) => ({
    ...r,
    status: referralStatus({ ...r, applicationCount: r.applications.length }),
  }));
}
