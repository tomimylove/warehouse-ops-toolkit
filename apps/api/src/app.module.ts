import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

@Module({
  imports: [PrismaModule, AuthModule, AnnouncementsModule],
})
export class AppModule {}
