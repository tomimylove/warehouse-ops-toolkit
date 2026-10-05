import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

// PermissionsGuard (used on TeamsController) depends on CurrentUserService,
// which AuthModule exports — without importing it here, Nest can't resolve
// that dependency and the whole app fails to boot (crashes the Lambda).
@Module({
  imports: [AuthModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
