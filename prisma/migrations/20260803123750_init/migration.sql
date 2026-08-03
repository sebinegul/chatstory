-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "privacyAcceptedAt" DATETIME,
    "clientIpHash" TEXT,
    "previewCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ChatUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "parsedJson" TEXT NOT NULL,
    CONSTRAINT "ChatUpload_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "personA" TEXT NOT NULL,
    "personB" TEXT NOT NULL,
    "specialDatesJson" TEXT NOT NULL,
    "chaptersJson" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "BookConfig_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleOptionsJson" TEXT NOT NULL,
    "dedication" TEXT NOT NULL,
    "pagesJson" TEXT NOT NULL,
    "isWatermarked" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Book_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL DEFAULT 4900,
    "status" TEXT NOT NULL DEFAULT 'mock_pending',
    "unlockedAt" DATETIME,
    CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "previews" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatUpload_sessionId_key" ON "ChatUpload"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BookConfig_sessionId_key" ON "BookConfig"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_sessionId_key" ON "Book"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sessionId_key" ON "Order"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ipHash_dayKey_key" ON "RateLimit"("ipHash", "dayKey");
