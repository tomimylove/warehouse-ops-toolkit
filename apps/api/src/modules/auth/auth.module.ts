import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { CurrentUserService } from './current-user.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [CurrentUserService, PermissionsGuard],
  exports: [CurrentUserService, PermissionsGuard],
})
export class AuthModule {}
