-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateSessionId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionEvent_candidateSessionId_fkey" FOREIGN KEY ("candidateSessionId") REFERENCES "CandidateSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CandidateSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "currentQuizIndex" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timeRemaining" INTEGER NOT NULL,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "isFullyGraded" BOOLEAN NOT NULL DEFAULT false,
    "gradedAt" DATETIME,
    "gradedBy" TEXT,
    CONSTRAINT "CandidateSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CandidateSession" ("candidateId", "completedAt", "currentQuizIndex", "gradedAt", "gradedBy", "id", "isFullyGraded", "sessionId", "startedAt", "status", "timeRemaining") SELECT "candidateId", "completedAt", "currentQuizIndex", "gradedAt", "gradedBy", "id", "isFullyGraded", "sessionId", "startedAt", "status", "timeRemaining" FROM "CandidateSession";
DROP TABLE "CandidateSession";
ALTER TABLE "new_CandidateSession" RENAME TO "CandidateSession";
CREATE UNIQUE INDEX "CandidateSession_candidateId_sessionId_key" ON "CandidateSession"("candidateId", "sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SessionEvent_candidateSessionId_idx" ON "SessionEvent"("candidateSessionId");

