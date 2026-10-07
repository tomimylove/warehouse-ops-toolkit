CREATE TABLE "_TaskAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

ALTER TABLE "_TaskAssignees" ADD CONSTRAINT "_TaskAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TaskAssignees" ADD CONSTRAINT "_TaskAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "_TaskAssignees_AB_unique" ON "_TaskAssignees"("A", "B");
CREATE INDEX "_TaskAssignees_B_index" ON "_TaskAssignees"("B");

-- Carry over any existing single assignee into the new join table before
-- dropping the old column.
INSERT INTO "_TaskAssignees" ("A", "B") SELECT "id", "assigneeId" FROM "Tasks" WHERE "assigneeId" IS NOT NULL;

ALTER TABLE "Tasks" DROP CONSTRAINT IF EXISTS "Tasks_assigneeId_fkey";
ALTER TABLE "Tasks" DROP COLUMN "assigneeId";
