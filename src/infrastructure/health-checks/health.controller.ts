import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { CustomMailerHealthIndicator } from './custom-mailer.health';
import { BullHealthIndicator } from './bull-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mailerHealth: CustomMailerHealthIndicator,
    private bullHealth: BullHealthIndicator,
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

  @Get('mail-1')
  @HealthCheck()
  checkMail1() {
    return this.health.check([() => this.mailerHealth.isHealthy('mail')]);
  }

  @Get('queue')
  @HealthCheck()
  checkQueue() {
    return this.health.check([() => this.bullHealth.isHealthy('queue')]);
  }
}
