import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';

@Module({
  imports: [PrismaModule, AuthModule, AnnouncementsModule, TasksModule, TeamsModule],
  controllers: [AppController],
})
export class AppModule {}
