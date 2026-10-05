-- Netlify's account build credits were exhausted, so the previously-deployed
-- function (built against the old schema) stayed live after likedBy was
-- dropped in 20261005140000. Restoring the column as a no-op compatibility
-- shim unblocks production immediately; it's unused dead weight once a
-- fresh deploy picks up the `reactions` column and can be dropped then.
ALTER TABLE "AnnouncementComments" ADD COLUMN IF NOT EXISTS "likedBy" TEXT[] NOT NULL DEFAULT '{}';
