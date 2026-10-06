ALTER TABLE "TaskComments" ADD COLUMN "reactions" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "TaskComments" ADD COLUMN "replyToId" TEXT;
ALTER TABLE "TaskComments" ADD CONSTRAINT "TaskComments_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "TaskComments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
