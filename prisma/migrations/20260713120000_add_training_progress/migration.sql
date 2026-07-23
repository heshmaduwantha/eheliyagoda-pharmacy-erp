CREATE TYPE "TrainingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "TrainingProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonKey" VARCHAR(120) NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "lastStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingProgress_userId_lessonKey_key" ON "TrainingProgress"("userId", "lessonKey");
CREATE INDEX "TrainingProgress_userId_status_idx" ON "TrainingProgress"("userId", "status");

ALTER TABLE "TrainingProgress"
ADD CONSTRAINT "TrainingProgress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
