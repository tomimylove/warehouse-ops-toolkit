ALTER TABLE "AnnouncementComments" DROP COLUMN "likedBy";
ALTER TABLE "AnnouncementComments" ADD COLUMN "reactions" JSONB NOT NULL DEFAULT '{}'::jsonb;
