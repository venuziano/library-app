import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CustomMailerHealthIndicator } from './custom-mailer.health';
import { BullHealthIndicator } from './bull-health.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [CustomMailerHealthIndicator, BullHealthIndicator],
})
export class HealthModule {}
