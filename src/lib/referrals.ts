import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { isStaffInputDelayed, isValidApplication, personKey } from "./rules";
import { referralStatus, type StatusKey } from "./status";

export type ReferralFilter = {
  campusId?: number;
  q?: string;
};

const listInclude = {
  campus: true,
  applications: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.ReferralInclude;

type ReferralWithApps = Prisma.ReferralGetPayload<{ include: typeof listInclude }>;

export const FLAGS = [
  { key: "late", label: "期限終了後申請（未承認）" },
  { key: "delayed", label: "職員入力が3日超過" },
  { key: "duplicate", label: "外部生の重複疑い" },
] as const;

export type FlagKey = (typeof FLAGS)[number]["key"];

export function isFlagKey(value: string | undefined): value is FlagKey {
  return FLAGS.some((f) => f.key === value);
}

export type ReferralRow = ReferralWithApps & {
  status: StatusKey;
  flags: Record<FlagKey, boolean>;
};

export function withStatus(r: ReferralWithApps, now = new Date()): StatusKey {
  return referralStatus({ ...r, validApplicationCount: r.applications.filter(isValidApplication).length }, now);
}

// 紹介された外部生ごとに、最初に登録された特典コードの id を返す
async function firstReferralByPerson(): Promise<Map<string, number>> {
  const all = await prisma.referral.findMany({
    where: { referredName: { not: null } },
    select: { id: true, referredName: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const first = new Map<string, number>();
  for (const r of all) {
    const key = personKey(r.referredName);
    if (key && !first.has(key)) first.set(key, r.id);
  }
  return first;
}

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
  const [rows, first] = await Promise.all([
    prisma.referral.findMany({ where, include: listInclude, orderBy: { code: "desc" } }),
    firstReferralByPerson(),
  ]);
  const now = new Date();
  return rows.map((r) => {
    const key = personKey(r.referredName);
    return {
      ...r,
      status: withStatus(r, now),
      flags: {
        late: r.applications.some((a) => !isValidApplication(a)) && !r.applications.some(isValidApplication),
        delayed: isStaffInputDelayed(r.enrolledAt, r.assignedAt, now) && !r.giftSentAt,
        duplicate: key !== null && first.get(key) !== r.id && !r.duplicateAck,
      },
    };
  });
}

export type DuplicateMatch = {
  id: number;
  code: string;
  studentName: string | null;
  referredName: string | null;
  enrollmentType: string | null;
  status: StatusKey;
};

// 同じ外部生が過去に紹介特典の対象になっていないか（運用マニュアル STEP3 の入力時チェック）
export async function findDuplicateReferred(name: string | null, excludeId?: number): Promise<DuplicateMatch[]> {
  const key = personKey(name);
  if (!key) return [];
  const candidates = await prisma.referral.findMany({
    where: { referredName: { not: null }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    include: listInclude,
    orderBy: { createdAt: "asc" },
  });
  return candidates
    .filter((r) => personKey(r.referredName) === key)
    .map((r) => ({
      id: r.id,
      code: r.code,
      studentName: r.studentName,
      referredName: r.referredName,
      enrollmentType: r.enrollmentType,
      status: withStatus(r),
    }));
}
