import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CustomMailerHealthIndicator } from './custom-mailer.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [CustomMailerHealthIndicator],
  exports: [CustomMailerHealthIndicator],
})
export class HealthModule {}
