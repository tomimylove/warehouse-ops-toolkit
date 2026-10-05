import { Controller, Get } from '@nestjs/common';

// Render's health check hits GET / and expects a 2xx response — without
// this the app module has no root route at all and Render would see the
// service as unhealthy even while every real endpoint works fine.
@Controller()
export class AppController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}
