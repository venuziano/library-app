import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { UserRegistered } from 'src/domain/events/user/user-registered.event';
import { MailQueueService } from 'src/infrastructure/mail/mail-queue.service';

@EventsHandler(UserRegistered)
export class SendVerificationEvent implements IEventHandler<UserRegistered> {
  constructor(private readonly mailQueue: MailQueueService) {}

  handle(event: UserRegistered) {
    // retry if fail to send email
    return this.mailQueue.enqueueVerification(
      event.email,
      event.username,
      event.verificationCode,
    );
  }
}
