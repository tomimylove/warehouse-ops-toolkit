import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { ColumnsController } from './columns.controller';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, BoardsController, ColumnsController, TasksController],
  providers: [ProjectsService, BoardsService, TasksService],
})
export class TasksModule {}
