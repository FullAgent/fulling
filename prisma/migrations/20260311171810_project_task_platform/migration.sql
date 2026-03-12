-- CreateEnum
CREATE TYPE "ProjectTaskType" AS ENUM ('CLONE_REPOSITORY', 'INSTALL_SKILL', 'UNINSTALL_SKILL', 'DEPLOY_PROJECT');

-- CreateEnum
CREATE TYPE "ProjectTaskStatus" AS ENUM ('PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectTaskTriggerSource" AS ENUM ('USER_ACTION', 'SYSTEM_EVENT', 'POLICY_ROLLOUT');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "importError",
DROP COLUMN "importLockedUntil",
DROP COLUMN "importStatus";

-- DropEnum
DROP TYPE "ProjectImportStatus";

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sandboxId" TEXT,
    "type" "ProjectTaskType" NOT NULL,
    "status" "ProjectTaskStatus" NOT NULL DEFAULT 'PENDING',
    "triggerSource" "ProjectTaskTriggerSource" NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lockedUntil" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectTask_status_lockedUntil_idx" ON "ProjectTask"("status", "lockedUntil");

-- CreateIndex
CREATE INDEX "ProjectTask_type_status_idx" ON "ProjectTask"("type", "status");

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
