CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "installCommand" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectTask"
ADD COLUMN "userSkillId" TEXT,
ADD COLUMN "skillId" TEXT;

CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");
CREATE INDEX "UserSkill_userId_idx" ON "UserSkill"("userId");
CREATE INDEX "UserSkill_skillId_idx" ON "UserSkill"("skillId");

CREATE INDEX "ProjectTask_projectId_skillId_type_status_idx"
ON "ProjectTask"("projectId", "skillId", "type", "status");

CREATE INDEX "ProjectTask_userSkillId_idx" ON "ProjectTask"("userSkillId");

ALTER TABLE "UserSkill"
ADD CONSTRAINT "UserSkill_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_userSkillId_fkey"
FOREIGN KEY ("userSkillId") REFERENCES "UserSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
