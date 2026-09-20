import { Controller, Get } from '@nestjs/common';
import { CurrentUserService } from './current-user.service';

@Controller('me')
export class AuthController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get()
  get() {
    return this.currentUser.get();
  }
}
