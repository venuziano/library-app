import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { CustomMailerHealthIndicator } from './custom-mailer.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mailerHealth: CustomMailerHealthIndicator,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'ok' };
  }

  @Get('mail')
  @HealthCheck()
  checkMail() {
    return this.health.check([() => this.mailerHealth.isHealthy('mail')]);
  }
}
