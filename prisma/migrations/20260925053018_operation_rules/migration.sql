-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referralId" INTEGER NOT NULL,
    "campusId" INTEGER NOT NULL,
    "studentName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referredGrade" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "exceptionAt" DATETIME,
    "exceptionNote" TEXT,
    "expiryNoticeSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("address", "campusId", "confirmedAt", "createdAt", "email", "guardianName", "id", "phone", "referralId", "referredGrade", "referredName", "studentName") SELECT "address", "campusId", "confirmedAt", "createdAt", "email", "guardianName", "id", "phone", "referralId", "referredGrade", "referredName", "studentName" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE INDEX "Application_referralId_idx" ON "Application"("referralId");
CREATE TABLE "new_Referral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "campusId" INTEGER NOT NULL,
    "enrollmentType" TEXT,
    "studentName" TEXT,
    "referredName" TEXT,
    "staffName" TEXT,
    "distributedAt" DATETIME,
    "assignedAt" DATETIME,
    "cardGivenAt" DATETIME,
    "duplicateAck" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" DATETIME,
    "paidAt" DATETIME,
    "amazonOrderedAt" DATETIME,
    "giftCode" TEXT,
    "giftSentAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Referral_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Referral" ("amazonOrderedAt", "campusId", "code", "createdAt", "distributedAt", "enrolledAt", "enrollmentType", "giftCode", "giftSentAt", "id", "note", "paidAt", "referredName", "staffName", "studentName", "updatedAt") SELECT "amazonOrderedAt", "campusId", "code", "createdAt", "distributedAt", "enrolledAt", "enrollmentType", "giftCode", "giftSentAt", "id", "note", "paidAt", "referredName", "staffName", "studentName", "updatedAt" FROM "Referral";
DROP TABLE "Referral";
ALTER TABLE "new_Referral" RENAME TO "Referral";
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");
CREATE INDEX "Referral_campusId_idx" ON "Referral"("campusId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
