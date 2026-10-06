-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Tasks" ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Tasks" ADD COLUMN "recurrence" "TaskRecurrence" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Tasks" ADD COLUMN "assigneeId" TEXT;
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TaskComments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivityLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskComments" ADD CONSTRAINT "TaskComments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComments" ADD CONSTRAINT "TaskComments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivityLog" ADD CONSTRAINT "TaskActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskActivityLog" ADD CONSTRAINT "TaskActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
