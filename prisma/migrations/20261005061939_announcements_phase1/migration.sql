-- AlterTable
ALTER TABLE "Announcements" ADD COLUMN     "visibleToAll" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "AnnouncementTeams" (
    "announcementId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementTeams_pkey" PRIMARY KEY ("announcementId","teamId")
);

-- CreateTable
CREATE TABLE "AnnouncementReads" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementReads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementVersions" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "snapshot" JSONB,
    "changes" TEXT[],
    "activity" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "savedById" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementVersions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReads_announcementId_userId_key" ON "AnnouncementReads"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teams_name_key" ON "Teams"("name");

-- AddForeignKey
ALTER TABLE "AnnouncementTeams" ADD CONSTRAINT "AnnouncementTeams_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementTeams" ADD CONSTRAINT "AnnouncementTeams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReads" ADD CONSTRAINT "AnnouncementReads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReads" ADD CONSTRAINT "AnnouncementReads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementVersions" ADD CONSTRAINT "AnnouncementVersions_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementVersions" ADD CONSTRAINT "AnnouncementVersions_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

