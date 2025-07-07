import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CustomMailerHealthIndicator {
  constructor(
    private readonly mailer: MailerService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // verify() resolves if SMTP transport is healthy
      await (this.mailer as any).transporter.verify();
      return indicator.up();
    } catch (err) {
      return indicator.down({
        error: (err as Error).message,
      });
    }
  }
}
