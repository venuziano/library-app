import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { UserEmailVerified } from 'src/domain/events/user/user-verified.event';
import { MailQueueService } from 'src/infrastructure/mail/mail-queue.service';

@EventsHandler(UserEmailVerified)
export class SendWelcomeEvent implements IEventHandler<UserEmailVerified> {
  constructor(private readonly mailQueue: MailQueueService) {}

  handle(event: UserEmailVerified) {
    // retry if fail to send email
    return this.mailQueue.enqueueWelcome(event.email, event.username);
  }
}
