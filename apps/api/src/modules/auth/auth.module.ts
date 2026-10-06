import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { CurrentUserService } from './current-user.service';
import { PermissionsGuard } from './permissions.guard';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, UsersController],
  providers: [CurrentUserService, PermissionsGuard, UsersService],
  exports: [CurrentUserService, PermissionsGuard, UsersService],
})
export class AuthModule {}
