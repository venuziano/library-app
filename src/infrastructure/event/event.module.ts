import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SendVerificationEvent } from 'src/application/events/email/send-verification.event';
import { SendWelcomeEvent } from 'src/application/events/email/send-welcome.event';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [SendVerificationEvent, SendWelcomeEvent],
  exports: [CqrsModule],
})
export class EventModule {}
