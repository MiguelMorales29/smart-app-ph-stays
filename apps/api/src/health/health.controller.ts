import { Controller, Get } from '@nestjs/common';
import { words } from '@smartapp/core';

@Controller('health')
export class HealthController {
  @Get()
  check(): { ok: true; app: typeof words.appName } {
    return {
      ok: true,
      app: words.appName,
    };
  }
}
