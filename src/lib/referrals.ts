import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sameName } from "./normalize";
import { isAfterQrDeadline, isStaffInputDelayed, isValidApplication, personKey, qrDeadlineDate } from "./rules";
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

// 要対応（エラー）の種類。校舎画面・経理画面の両方で表示する
export const FLAGS = [
  { key: "late", short: "期限終了後申請", label: "期限終了後申請（未承認）", hint: "カード配布から1か月を過ぎて保護者が入力。特例にするかは校舎責任者・NEPと相談" },
  { key: "noticeUnsent", short: "通知未送信", label: "期限切れ通知メール未送信", hint: "期限切れの通知メールが送れていません" },
  { key: "dueSoon", short: "期限間近", label: "入力期限7日以内・未申込", hint: "保護者の入力期限が近づいています。保護者へ声かけしてください" },
  { key: "noAssignment", short: "職員未入力", label: "職員未入力のコードへ申込", hint: "保護者の申込みはあるが、STEP3（塾生・紹介された生徒・区分）が未入力" },
  { key: "delayed", short: "入力3日超過", label: "職員入力が3日超過", hint: "入塾・講習申込日から3日以内に STEP3 を入力してください" },
  { key: "mismatch", short: "入力不一致", label: "保護者入力と職員入力の不一致", hint: "保護者が入力した生徒名・紹介した方が職員入力と一致しません" },
  { key: "duplicate", short: "外部生重複?", label: "外部生の重複疑い", hint: "同じ外部生が別のコードで特典対象になっています" },
] as const;

const DUE_SOON_DAYS = 7;

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

function flagsFor(r: ReferralWithApps, now: Date, duplicate: boolean): Record<FlagKey, boolean> {
  const valid = r.applications.filter(isValidApplication);
  const latest = valid[0];
  const unapprovedLate = r.applications.filter((a) => !isValidApplication(a));
  const deadline = r.cardGivenAt ? qrDeadlineDate(r.cardGivenAt) : null;
  return {
    late: unapprovedLate.length > 0 && valid.length === 0,
    noticeUnsent: unapprovedLate.some((a) => !a.expiryNoticeSentAt),
    dueSoon:
      !!r.studentName &&
      valid.length === 0 &&
      deadline !== null &&
      !isAfterQrDeadline(r.cardGivenAt, now) &&
      deadline.getTime() - now.getTime() < DUE_SOON_DAYS * 86400000,
    noAssignment: r.applications.length > 0 && !r.studentName,
    delayed: isStaffInputDelayed(r.enrolledAt, r.assignedAt, now) && !r.giftSentAt,
    mismatch:
      !!latest &&
      ((!!r.referredName && !sameName(latest.referredName, r.referredName)) ||
        (!!r.studentName && !sameName(latest.studentName, r.studentName))),
    duplicate,
  };
}

export async function listReferrals(filter: ReferralFilter = {}): Promise<ReferralRow[]> {
  const q = filter.q?.trim();
  const where: Prisma.ReferralWhereInput = {
    ...(filter.campusId ? { campusId: filter.campusId } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { studentName: { contains: q, mode: "insensitive" } },
            { referredName: { contains: q, mode: "insensitive" } },
            { staffName: { contains: q, mode: "insensitive" } },
            {
              applications: {
                some: {
                  OR: [
                    { studentName: { contains: q, mode: "insensitive" } },
                    { guardianName: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { referredName: { contains: q, mode: "insensitive" } },
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
      flags: flagsFor(r, now, key !== null && first.get(key) !== r.id && !r.duplicateAck),
    };
  });
}

// 1件分の状態・要対応フラグ（詳細画面用）
export async function getReferralRow(id: number): Promise<ReferralRow | null> {
  const [r, first] = await Promise.all([
    prisma.referral.findUnique({ where: { id }, include: listInclude }),
    firstReferralByPerson(),
  ]);
  if (!r) return null;
  const now = new Date();
  const key = personKey(r.referredName);
  return {
    ...r,
    status: withStatus(r, now),
    flags: flagsFor(r, now, key !== null && first.get(key) !== r.id && !r.duplicateAck),
  };
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

export async function listApplyErrors(campusId?: number) {
  return prisma.applyError.findMany({
    where: campusId ? { campusId } : {},
    include: { campus: true },
    orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
  });
}

export const APPLY_ERROR_REASONS: Record<string, string> = {
  not_found: "招待コードが見つからない",
  gift_sent: "特典送付済みのコード",
};
