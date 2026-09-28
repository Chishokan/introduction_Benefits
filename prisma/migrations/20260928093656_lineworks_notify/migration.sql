-- AlterTable
ALTER TABLE "Campus" ADD COLUMN     "lineWorksWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "noApplyNotifiedAt" TIMESTAMP(3);

-- 既存データ（スプレッドシートから取り込んだ旧データなど）で、すでに「職員入力から1週間・保護者申込みなし」に
-- 該当しているコードは通知済みとして扱い、機能追加直後に大量の通知が飛ばないようにする
UPDATE "Referral" r
SET "noApplyNotifiedAt" = NOW()
WHERE r."studentName" IS NOT NULL
  AND r."assignedAt" IS NOT NULL
  AND r."assignedAt" < NOW() - INTERVAL '7 days'
  AND r."giftSentAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Application" a WHERE a."referralId" = r."id");
