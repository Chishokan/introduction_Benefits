-- CreateTable
CREATE TABLE "Campus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "campusId" INTEGER NOT NULL,
    "enrollmentType" TEXT,
    "studentName" TEXT,
    "referredName" TEXT,
    "staffName" TEXT,
    "distributedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "cardGivenAt" TIMESTAMP(3),
    "duplicateAck" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "amazonOrderedAt" TIMESTAMP(3),
    "giftCode" TEXT,
    "giftSentAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "referralId" INTEGER NOT NULL,
    "campusId" INTEGER NOT NULL,
    "studentName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referredGrade" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "late" BOOLEAN NOT NULL DEFAULT false,
    "exceptionAt" TIMESTAMP(3),
    "exceptionNote" TEXT,
    "expiryNoticeSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplyError" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "campusId" INTEGER,
    "studentName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplyError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_name_key" ON "Campus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_campusId_idx" ON "Referral"("campusId");

-- CreateIndex
CREATE INDEX "Application_referralId_idx" ON "Application"("referralId");

-- CreateIndex
CREATE INDEX "ApplyError_campusId_idx" ON "ApplyError"("campusId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplyError" ADD CONSTRAINT "ApplyError_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
