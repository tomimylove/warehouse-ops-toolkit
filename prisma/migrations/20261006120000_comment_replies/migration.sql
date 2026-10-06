ALTER TABLE "AnnouncementComments" ADD COLUMN "replyToId" TEXT;
ALTER TABLE "AnnouncementComments" ADD CONSTRAINT "AnnouncementComments_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "AnnouncementComments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
