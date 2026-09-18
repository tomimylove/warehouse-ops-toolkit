import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

@Module({
  imports: [PrismaModule, AnnouncementsModule],
})
export class AppModule {}
