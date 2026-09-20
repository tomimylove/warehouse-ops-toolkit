import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { CurrentUserService } from './current-user.service';
import { PermissionsGuard } from './permissions.guard';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [CurrentUserService, PermissionsGuard, UsersService],
  exports: [CurrentUserService, PermissionsGuard, UsersService],
})
export class AuthModule {}
